'use client';

import { forwardRef, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {hasLeftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white text-slate-900 placeholder:text-slate-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'rounded-xl border',
              error
                ? 'border-rose-500 focus:ring-rose-500 pl-12 pr-4 py-3'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 dark:bg-slate-800 dark:text-slate-100',
              hasLeftIcon && !hasRightIcon ? 'pl-12 pr-4 py-3' : 'px-4 py-3',
              hasRightIcon && !hasLeftIcon ? 'pl-4 pr-12 py-3' : 'px-4 py-3',
              hasLeftIcon && hasRightIcon ? 'pl-12 pr-12 py-3' : 'px-4 py-3',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {hasRightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };