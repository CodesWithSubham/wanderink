import { ReactNode } from 'react';
import { AuthGuard } from '@/components/providers/AuthProvider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </AuthGuard>
  );
}