'use client';

import { forwardRef, LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5', className)}
      {...props}
    >
      {children}
    </label>
  )
);
Label.displayName = 'Label';

export { Label };