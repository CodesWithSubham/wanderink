'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Heart, Share2, BookOpen, MapPin, Calendar, Star, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StoryReader } from '@/components/adventure/StoryReader';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';

function StoryPageContent() {
  const params = useParams();
  const storyId = params.id as string;
  const { user } = useAuth();

  const { data: adventureData, isLoading, error } = useQuery({
    queryKey: ['public-story', storyId],
    queryFn: async () => {
      const res = await fetch(`/api/adventures/public/${storyId}`);
      if (!res.ok) throw new Error('Story not found');
      const data = await res.json();
      return data.data;
    },
    enabled: !!storyId,
  });

  const adventure = adventureData;

  const handleLike = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    try {
      await fetch(`/api/adventures/${storyId}/like`, { method: 'POST' });
    } catch {
      // Error handled by toast
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = adventure?.title || 'WanderInk Story';

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !adventure) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mx-auto max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Story not found
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            This story doesn't exist or has been removed.
          </p>
          <Link href="/explore">
            <Button>← Back to Explore</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explore
      </Link>

      <StoryReader
        adventure={adventure}
        isOwner={false}
        onLike={handleLike}
      />
    </div>
  );
}

export default function StoryPage() {
  return <StoryPageContent />;
}