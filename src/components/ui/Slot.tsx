'use client';

import { forwardRef, HTMLAttributes, ReactElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface SlotProps extends HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const Slot = forwardRef<HTMLSpanElement, SlotProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<any>;
      return (
        <child.type
          ref={ref}
          className={cn(child.props.className, className)}
          {...child.props}
          {...props}
        />
      );
    }

    return <span ref={ref} className={className} {...props}>{children}</span>;
  }
);
Slot.displayName = 'Slot';

export { Slot };