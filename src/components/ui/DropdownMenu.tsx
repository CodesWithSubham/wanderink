'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownMenuContextType {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  registerItem: (id: string, onSelect: () => void) => void;
  unregisterItem: (id: string) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu.Root');
  }
  return context;
}

interface DropdownMenuRootProps {
  children: ReactNode;
}

export function DropdownMenuRoot({ children }: DropdownMenuRootProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, () => void>>(new Map());

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const registerItem = useCallback((id: string, onSelect: () => void) => {
    itemsRef.current.set(id, onSelect);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

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

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <DropdownMenuContext.Provider
      value={{ isOpen, triggerRef, contentRef, toggle, close, registerItem, unregisterItem }}
    >
      {children}
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

function DropdownMenuTrigger({ className, children, asChild = false, ...props }: DropdownMenuTriggerProps) {
  const { isOpen, triggerRef, toggle } = useDropdownMenuContext();

  const child = typeof children === 'object' && children !== null && 'props' in children
    ? (children as React.ReactElement<any>)
    : null;

  const Comp = asChild && child ? child.type : 'button';

  const handleClick = (e: React.MouseEvent) => {
    child?.props.onClick?.(e);
    toggle();
  };

  if (asChild && child) {
    const isButton = child.type === 'button';
    return React.cloneElement(child, {
      ref: triggerRef,
      ...(isButton ? { type: 'button' } : {}),
      onClick: handleClick,
      className: cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300',
        'rounded-xl border border-slate-300 dark:border-slate-600',
        'bg-white dark:bg-slate-800',
        'hover:bg-slate-50 dark:hover:bg-slate-700',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
        'transition-colors duration-200',
        className
      ),
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
      ...props,
    } as any);
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300',
        'rounded-xl border border-slate-300 dark:border-slate-600',
        'bg-white dark:bg-slate-800',
        'hover:bg-slate-50 dark:hover:bg-slate-700',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
        'transition-colors duration-200',
        className
      )}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'start' | 'end';
}

function DropdownMenuContent({ className, children, align = 'end', ...props }: DropdownMenuContentProps) {
  const { isOpen, contentRef, close } = useDropdownMenuContext();

  if (!isOpen) return null;

  return (
    <Fragment>
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-800',
          'border border-slate-200 dark:border-slate-700',
          'shadow-lg animate-slide-down',
          align === 'end' ? 'right-0' : 'left-0',
          className
        )}
        role="menu"
        {...props}
      >
        <div className="py-1">{children}</div>
      </div>
    </Fragment>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  inset?: boolean;
  shortcut?: string;
  destructive?: boolean;
  checked?: boolean;
  asChild?: boolean;
}

function DropdownMenuItem({ className, children, inset, shortcut, destructive, checked, onClick, id, asChild = false, ...props }: DropdownMenuItemProps) {
  const { close, registerItem, unregisterItem } = useDropdownMenuContext();
  const itemId = id || `dropdown-item-${Math.random().toString(36).slice(2, 9)}`;

  const child = typeof children === 'object' && children !== null && 'props' in children
    ? (children as React.ReactElement<any>)
    : null;

  const Comp = asChild && child ? child.type : 'button';

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    child?.props.onClick?.(event);
    onClick?.(event);
    close();
  };

  useEffect(() => {
    const handleSelect = () => {
      close();
      onClick?.({} as React.MouseEvent<HTMLButtonElement>);
    };
    registerItem(itemId, handleSelect);
    return () => unregisterItem(itemId);
  }, [itemId, close, onClick, registerItem, unregisterItem]);

  const itemProps = {
    id: itemId,
    type: Comp === 'button' ? 'button' as const : undefined,
    role: 'menuitem',
    onClick: handleClick,
    className: cn(
      'w-full flex items-center gap-3 px-4 py-2.5 text-sm',
      'text-slate-700 dark:text-slate-300',
      'hover:bg-slate-100 dark:hover:bg-slate-700',
      'focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700',
      'transition-colors duration-150',
      inset && 'pl-10',
      destructive && 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30',
      className
    ),
    ...props,
  };

  if (asChild && child) {
    return React.cloneElement(child, itemProps as any);
  }

  return (
    <button {...itemProps}>
      {checked && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && <span className="text-xs text-slate-400 dark:text-slate-500">{shortcut}</span>}
    </button>
  );
}

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return <hr className={cn('my-1 border-slate-200 dark:border-slate-700', className)} {...props} />;
}

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  inset?: boolean;
}

function DropdownMenuLabel({ className, children, inset, ...props }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn('px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide', inset && 'pl-10', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Label: DropdownMenuLabel,
});