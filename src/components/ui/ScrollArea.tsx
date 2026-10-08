'use client';

import { forwardRef, HTMLAttributes, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [showScrollbar, setShowScrollbar] = useState(false);

    useEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      const handleScroll = () => {
        setShowScrollbar(viewport.scrollHeight > viewport.clientHeight);
      };

      handleScroll();
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }, []);

    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div
          ref={viewportRef}
          className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300/50 hover:scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600/50 dark:hover:scrollbar-thumb-slate-500"
        >
          {children}
        </div>
        {showScrollbar && (
          <div className="absolute right-1 top-1 bottom-1 w-1.5 bg-transparent pointer-events-none" aria-hidden="true" />
        )}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };