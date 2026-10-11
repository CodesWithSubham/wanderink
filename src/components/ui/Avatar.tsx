'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', shape = 'circle', ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-xl',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const displayInitial = fallback
      ? (fallback.trim().length > 2 ? getInitials(fallback) : fallback.trim().toUpperCase())
      : (alt ? getInitials(alt) : '?');

    const showFallback = !src || imageError;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium bg-slate-100 dark:bg-slate-800',
          'overflow-hidden border border-slate-200 dark:border-slate-700 select-none',
          sizes[size],
          shapes[shape],
          className
        )}
        {...props}
      >
        {!showFallback && src ? (
          <img
            src={src}
            alt={alt || ''}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-600 dark:text-slate-400 font-semibold">
            {displayInitial}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn('w-full h-full object-cover', className)}
      {...props}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps extends HTMLAttributes<HTMLSpanElement> {}

const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('w-full h-full flex items-center justify-center text-slate-600 dark:text-slate-400', className)}
      {...props}
    />
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };