'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { AdventureForm } from '@/components/adventure/AdventureForm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function NewAdventurePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // AuthGuard will handle redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-2">
              New Adventure
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Upload 3-5 photos from your walk and let AI create your story
            </p>
          </div>
          <AdventureForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}