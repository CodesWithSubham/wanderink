'use client';

import { formatDate } from '@/lib/utils';
import { Heart, Share2, Download, BookOpen, MapPin, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdventureResponse } from '@/types/adventure';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useAuth } from '@/components/providers/AuthProvider';

interface StoryReaderProps {
  adventure: AdventureResponse;
  isOwner?: boolean;
  onLike?: () => void;
}

export function StoryReader({ adventure, isOwner = false, onLike }: StoryReaderProps) {
  const { user } = useAuth();
  const displayLikes = adventure.likesCount;
  const displayLiked = adventure.isLiked;

  const handleLike = () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    onLike?.();
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = adventure.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const paragraphs = adventure.story.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <article className="max-w-3xl mx-auto">
      {/* Hero Cover */}
      <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden mb-10 bg-slate-100 dark:bg-slate-800">
        {adventure.imageUrls.length > 0 ? (
          <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
            {adventure.imageUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative overflow-hidden" style={{ gridColumn: index === 0 && adventure.imageUrls.length > 1 ? 'span 2' : 'auto' }}>
                <img
                  src={url}
                  alt={index === 0 ? adventure.title : ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <BookOpen className="w-16 h-16" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-500/90 text-white backdrop-blur">
              {adventure.visibility === 'public' ? 'Public' : 'Private'}
            </span>
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-slate-900/80 text-white backdrop-blur">
              Mood: {adventure.moodScore}/10
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white font-serif leading-tight">
            {adventure.title}
          </h1>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 mb-8 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={adventure.createdAt}>{formatDate(adventure.createdAt)}</time>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>{adventure.imageUrls.length} photos</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <span>{adventure.moodScore}/10 mood</span>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-10 p-6 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{adventure.summary}</p>
      </div>

      {/* Highlights */}
      {adventure.highlights.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adventure.highlights.map((highlight, index) => (
              <Card key={index} variant="outlined" padding="md" className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <p className="text-slate-700 dark:text-slate-300">{highlight}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Full Story */}
      <section className="mb-10">
        <div className="prose prose-lg dark:prose-invert max-w-none font-serif text-slate-800 dark:text-slate-200 leading-relaxed">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mb-6 first:drop-cap:float-left first:drop-cap:font-serif first:drop-cap:text-6xl first:drop-cap:text-emerald-600 first:drop-cap:font-bold first:drop-cap:pr-3 first:drop-cap:pb-1">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="flex items-center gap-1">Edit</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item asChild>
                  <a href={`/adventures/${adventure.id}`} className="w-full">View in Dashboard</a>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item className="text-rose-600">Delete</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="sm" onClick={handleLike} aria-pressed={displayLiked}>
            <Heart className={cn('w-4 h-4 mr-1', displayLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} />
            <span className="font-medium">{displayLikes}</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>

        {!isOwner && user && (
          <Button variant="outline" size="sm">
            <BookOpen className="w-4 h-4 mr-1" />
            Start Your Adventure
          </Button>
        )}
      </div>
    </article>
  );
}