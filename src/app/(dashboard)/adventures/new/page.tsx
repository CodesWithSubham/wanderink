'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { AdventureForm } from '@/components/adventure/AdventureForm';
import { FieldJournalGuide } from '@/components/adventure/FieldJournalGuide';

export default function NewAdventurePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif mb-2">
          New Adventure
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Transform your outdoor observations into an authentic, personalized exploration journal.
        </p>
      </div>

      <FieldJournalGuide />

      <AdventureForm />
    </div>
  );
}