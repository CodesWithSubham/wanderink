'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SuspenseWrapper({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || (
      <div className={cn('flex items-center justify-center min-h-[200px]')}>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )}>
      {children}
    </Suspense>
  );
}