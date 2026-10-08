'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface SignedImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function SignedImage({ src, alt, className, fallback, onLoad, onError }: SignedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    setImageSrc(null);

    const img = new Image();
    img.onload = () => {
      if (mounted) {
        setImageSrc(src);
        setLoading(false);
        onLoad?.();
      }
    };
    img.onerror = () => {
      if (mounted) {
        setError(true);
        setLoading(false);
        onError?.();
      }
    };
    img.src = src;

    return () => {
      mounted = false;
    };
  }, [src, onLoad, onError]);

  if (loading) {
    return (
      <div
        className={cn('relative bg-slate-100 dark:bg-slate-800 animate-pulse', className)}
        aria-busy="true"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn('relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center', className)}
        role="img"
        aria-label={alt || 'Failed to load image'}
      >
        <ImageIcon className="w-12 h-12 text-slate-400" />
      </div>
    );
  }

  return (
    <img
      src={imageSrc || src}
      alt={alt || ''}
      className={cn('w-full h-full object-cover', className)}
      onLoad={onLoad}
      onError={onError}
    />
  );
}