'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode, Fragment } from 'react';
import { cn } from '@/lib/utils';

interface TooltipContextType {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  open: () => void;
  close: () => void;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within Tooltip.Root');
  }
  return context;
}

interface TooltipRootProps {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TooltipRoot({ children, defaultOpen = false, open: controlledOpen, onOpenChange }: TooltipRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(true);
    onOpenChange?.(true);
  }, [isControlled, onOpenChange]);

  const close = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        contentRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      close();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <TooltipContext.Provider value={{ isOpen, triggerRef, contentRef, open, close }}>
      {children}
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  asChild?: boolean;
}

function TooltipTrigger({ className, children, asChild = false, ...props }: TooltipTriggerProps) {
  const { isOpen, triggerRef, open, close } = useTooltipContext();

  const handleMouseEnter = () => open();
  const handleMouseLeave = () => close();
  const handleFocus = () => open();
  const handleBlur = () => close();

  const child = asChild && typeof children === 'object' && children !== null && 'props' in children
    ? children
    : <div className={cn('inline-flex', className)} {...props}>{children}</div>;

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {asChild
        ? React.cloneElement(child as React.ReactElement<any>, {
            onMouseEnter: (e: React.MouseEvent) => { child.props.onMouseEnter?.(e); handleMouseEnter(); },
            onMouseLeave: (e: React.MouseEvent) => { child.props.onMouseLeave?.(e); handleMouseLeave(); },
            onFocus: (e: React.FocusEvent) => { child.props.onFocus?.(e); handleFocus(); },
            onBlur: (e: React.FocusEvent) => { child.props.onBlur?.(e); handleBlur(); },
          })
        : child}
    </div>
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

function TooltipContent({ className, children, side = 'top', align = 'center', ...props }: TooltipContentProps) {
  const { isOpen, contentRef } = useTooltipContext();

  if (!isOpen) return null;

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const alignStyles = {
    start: side === 'top' || side === 'bottom' ? '-translate-x-0 left-0' : '-translate-y-0 top-0',
    center: side === 'top' || side === 'bottom' ? '-translate-x-1/2 left-1/2' : '-translate-y-1/2 top-1/2',
    end: side === 'top' || side === 'bottom' ? '-translate-x-full right-0' : '-translate-y-full bottom-0',
  };

  return (
    <Fragment>
      <div
        ref={contentRef}
        role="tooltip"
        className={cn(
          'absolute z-50 px-3 py-2 text-xs font-medium text-white',
          'bg-slate-900 dark:bg-slate-100 dark:text-slate-900',
          'rounded-lg shadow-lg whitespace-nowrap animate-fade-in',
          sideStyles[side],
          alignStyles[align],
          className
        )}
        {...props}
      >
        {children}
        <TooltipArrow side={side} />
      </div>
    </Fragment>
  );
}

interface TooltipArrowProps {
  side: 'top' | 'bottom' | 'left' | 'right';
}

function TooltipArrow({ side }: TooltipArrowProps) {
  const arrowStyles = {
    top: 'absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100',
    bottom: 'absolute top-[-4px] left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-900 dark:border-b-slate-100',
    left: 'absolute right-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900 dark:border-l-slate-100',
    right: 'absolute left-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-100',
  };

  return <div className={arrowStyles[side]} aria-hidden="true" />;
}

interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <TooltipRoot>{children}</TooltipRoot>;
}

export const Tooltip = Object.assign(TooltipRoot, {
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Provider: TooltipProvider,
});