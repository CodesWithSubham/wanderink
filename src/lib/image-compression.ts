import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

export interface CompressedImage {
  file: File;
  preview: string;
  originalName: string;
  originalSize: number;
  compressedSize: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const compressedFile = await imageCompression(file, opts);

  const preview = URL.createObjectURL(compressedFile);

  return {
    file: compressedFile,
    preview,
    originalName: file.name,
    originalSize: file.size,
    compressedSize: compressedFile.size,
  };
}

export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressedImage[]> {
  const results = await Promise.all(
    files.map((file) => compressImage(file, options))
  );
  return results;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB original

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Original file size must be less than 10MB' };
  }

  return { valid: true };
}

export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}