'use client';

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImages, validateImageFile, CompressedImage, revokePreviewUrl } from '@/lib/image-compression';
import { Button } from '@/components/ui/Button';
import { createPresignedUploadUrl } from '@/lib/r2';

interface ImageUploaderProps {
  maxFiles?: number;
  onUploadComplete: (results: Array<{ key: string; preview: string; originalName: string }>) => void;
  onError?: (error: string) => void;
}

export function ImageUploader({ maxFiles = 5, onUploadComplete, onError }: ImageUploaderProps) {
  const [files, setFiles] = useState<CompressedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);

    if (newFiles.length === 0) return;

    // Validate files
    const invalidFiles = newFiles.filter((file) => !validateImageFile(file).valid);
    if (invalidFiles.length > 0) {
      onError?.('Some files are invalid. Only JPEG, PNG, WebP under 10MB allowed.');
      return;
    }

    // Compress images
    try {
      const compressed = await compressImages(newFiles);
      setFiles((prev) => [...prev, ...compressed]);
    } catch {
      onError?.('Failed to compress images');
    }
  }, [files.length, maxFiles, onError]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file) revokePreviewUrl(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      // Request presigned URLs
      const response = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map((f) => ({
            name: f.originalName,
            type: f.file.type,
            size: f.file.size,
          })),
          visibility: 'private', // Will be set in the adventure creation form
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URLs');
      }

      const { data: presignedUrls } = await response.json();

      // Upload files to R2
      const uploadResults = await Promise.all(
        files.map(async (compressed, index) => {
          const { uploadUrl, key } = presignedUrls[index];

          // Track progress (simplified - in reality you'd use XMLHttpRequest for progress)
          setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: compressed.file,
            headers: { 'Content-Type': compressed.file.type },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${compressed.originalName}`);
          }

          setUploadProgress((prev) => ({ ...prev, [key]: 100 }));

          return {
            key,
            preview: compressed.preview,
            originalName: compressed.originalName,
          };
        })
      );

      onUploadComplete(uploadResults);
      setFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [files, onUploadComplete, onError]);

  const canUpload = files.length >= 3 && files.length <= maxFiles && !uploading;

  return (
    <div
      className={cn(
        'relative border-2 rounded-2xl transition-colors',
        dragActive
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className={cn(
          files.length === 0 && !uploading
            ? 'absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
            : 'hidden'
        )}
        disabled={uploading || files.length >= maxFiles}
        aria-label="Upload images"
      />

      {files.length === 0 && !uploading ? (
        <div className="p-12 text-center pointer-events-none">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1 font-serif">
            Drag & drop exploration photographs
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
            Or select 3–5 images from your walk (JPEG, PNG, or WebP • up to 10MB each)
          </p>
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Select Photographs
          </Button>
        </div>
      ) : (
        <>
          {/* File previews */}
          <div className="p-4 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {files.map((file, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={file.preview}
                    alt={file.originalName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  {uploadProgress[file.originalName] !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" style={{ width: `${uploadProgress[file.originalName]}%` }} />
                  )}
                </div>
              ))}

              {files.length < maxFiles && !uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={cn(
                    'aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600',
                    'flex flex-col items-center justify-center gap-2',
                    'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                    'transition-colors cursor-pointer'
                  )}
                  aria-label="Add more images"
                >
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Add more</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {files.length}/{maxFiles} selected
                {files.length < 3 && (
                  <span className="text-rose-500 ml-2">• Minimum 3 photographs required</span>
                )}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={!canUpload || uploading}
                  className="w-full sm:w-auto"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading & Optimizing...
                    </>
                  ) : (
                    'Upload & Continue to Review'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}