'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DialogContext.Provider>
  );
}

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within Dialog.Root');
  }
  return context;
}

interface DialogRootProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function DialogRoot({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: DialogRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const open = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(true);
    onOpenChange?.(true);
  }, [isControlled, onOpenChange]);

  const close = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && <DialogOverlay onClose={close} />}
    </DialogContext.Provider>
  );
}

interface DialogOverlayProps {
  onClose: () => void;
  children?: ReactNode;
}

function DialogOverlay({ onClose, children }: DialogOverlayProps) {
  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg">
          {children}
        </div>
      </div>
    </Fragment>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { close } = useDialogContext();

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 animate-slide-up',
        className
      )}
      {...props}
    >
      <button
        onClick={close}
        className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="p-6">{children}</div>
    </div>
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return <div className={cn('mb-4', className)} {...props}>{children}</div>;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-2xl font-bold text-slate-900 dark:text-slate-100', className)} {...props}>{children}</h2>;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
  return <p className={cn('mt-2 text-slate-500 dark:text-slate-400', className)} {...props}>{children}</p>;
}

export const Dialog = Object.assign(DialogRoot, {
  Trigger: ({ children, onClick }: { children: React.ReactElement<any>; onClick?: () => void }) => {
    const { open } = useDialogContext();
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        open();
      },
    });
  },
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
});