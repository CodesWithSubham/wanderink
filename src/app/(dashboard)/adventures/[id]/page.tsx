'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdventureCard } from '@/components/adventure/AdventureCard';
import { AdventureForm } from '@/components/adventure/AdventureForm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth, AuthGuard } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdventureResponse } from '@/types/adventure';
import { cn } from '@/lib/utils';

function AdventureDetailContent() {
  const params = useParams();
  const adventureId = params.id as string;
  const { user } = useAuth();

  const { data: adventureData, isLoading, error } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: async () => {
      const res = await fetch(`/api/adventures/${adventureId}`);
      if (!res.ok) throw new Error('Failed to fetch adventure');
      const data = await res.json();
      return data.data as AdventureResponse;
    },
    enabled: !!adventureId,
  });

  const adventure = adventureData;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this adventure? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/adventures/${adventureId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      window.location.href = '/dashboard';
    } catch {
      alert('Failed to delete adventure');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-8" />
        </div>
        <Card variant="outlined" padding="none" className="animate-pulse h-[400px]" />
      </div>
    );
  }

  if (error || !adventure) {
    return (
      <Card variant="outlined" padding="xl" className="text-center">
        <CardContent>
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Adventure not found
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            This adventure doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard">
            <Button>← Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (adventure.userId !== user?.id) {
    return (
      <Card variant="outlined" padding="xl" className="text-center">
        <CardContent>
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Access denied
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            You don't have permission to view this adventure.
          </p>
          <Link href="/dashboard">
            <Button>← Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isProcessing = adventure.status === 'processing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif">
              {adventure.title}
            </h1>
            <span className={cn(
              'px-3 py-1 text-sm font-medium rounded-full',
              adventure.visibility === 'public'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            )}>
              {adventure.visibility}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              Mood: {adventure.moodScore}/10
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {isProcessing ? (
            <Button variant="outline" disabled>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </Button>
          ) : adventure.status === 'failed' ? (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Generation
            </Button>
          ) : (
            <>
              <Link href={adventure.visibility === 'public' ? `/story/${adventure.id}` : `/adventures/${adventure.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  View Story
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete} className="text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-500">
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Story Preview or Generation Progress */}
      {isProcessing ? (
        <AdventureForm />
      ) : adventure.status === 'failed' ? (
        <Card variant="outlined" padding="xl" className="text-center border-rose-200 dark:border-rose-800">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Generation Failed
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {adventure.generationError || 'An error occurred while generating your story.'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry Generation</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Story Display */}
          <Card variant="outlined" padding="none" className="overflow-hidden">
            <CardContent className="pt-0">
              <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                {adventure.imageUrls.length > 0 ? (
                  <img
                    src={adventure.imageUrls[0]}
                    alt={adventure.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">No cover image</div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Summary</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-8">{adventure.summary}</p>

            {adventure.highlights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Highlights</h2>
                <ul className="space-y-2">
                  {adventure.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Full Story</h2>
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif">
              {adventure.story}
            </div>
          </div>

          {/* Image Gallery */}
          {adventure.imageUrls.length > 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">All Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {adventure.imageUrls.map((url, index) => (
                  <div key={index} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={url} alt={`${adventure.title} - Photo ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdventureDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <AuthGuard>
            <AdventureDetailContent />
          </AuthGuard>
        </div>
      </main>
      <Footer />
    </div>
  );
}