'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs.Root');
  }
  return context;
}

interface TabsRootProps {
  children: ReactNode;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TabsRoot({ children, defaultValue, value: controlledValue, onValueChange }: TabsRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : uncontrolledValue;

  const onTabChange = useCallback((value: string) => {
    if (!isControlled) {
      setUncontrolledValue(value);
    }
    onValueChange?.(value);
  }, [isControlled, onValueChange]);

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange }}>
      {children}
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

function TabsTrigger({ className, value, children, disabled, ...props }: TabsTriggerProps) {
  const { activeTab, onTabChange } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabs-panel-${value}`}
      id={`tabs-trigger-${value}`}
      type="button"
      onClick={() => !disabled && onTabChange(value)}
      disabled={disabled}
      className={cn(
        'relative px-4 py-2 text-sm font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        isActive
          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: ReactNode;
}

function TabsContent({ className, value, children, ...props }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabs-panel-${value}`}
      aria-labelledby={`tabs-trigger-${value}`}
      className={cn('mt-4 animate-fade-in', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});