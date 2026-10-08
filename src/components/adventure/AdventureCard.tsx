'use client';

import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { Heart, Eye, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdventureResponse } from '@/types/adventure';
import { Card, CardContent } from '@/components/ui/Card';

interface AdventureCardProps {
  adventure: AdventureResponse;
  variant?: 'default' | 'compact';
  showUser?: boolean;
  onLike?: () => void;
  isLiked?: boolean;
  likesCount?: number;
}

export function AdventureCard({
  adventure,
  variant = 'default',
  showUser = false,
  onLike,
  isLiked,
  likesCount,
}: AdventureCardProps) {
  const coverImage = adventure.imageUrls[0];
  const displayLikes = likesCount ?? adventure.likesCount;
  const displayLiked = isLiked ?? adventure.isLiked;

  if (variant === 'compact') {
    return (
      <Link
        href={`/story/${adventure.id}`}
        className="group flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">
            {adventure.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-1">
            {adventure.summary}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span>{formatRelativeTime(adventure.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Heart className={cn('w-3 h-3', displayLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} />
              {displayLikes}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card variant="outlined" padding="none" className="overflow-hidden h-full flex flex-col">
      <Link href={`/story/${adventure.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {coverImage ? (
            <img
              src={coverImage}
              alt=""
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <MapPin className="w-10 h-10" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            {adventure.visibility === 'public' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                Public
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 backdrop-blur">
              {adventure.moodScore}/10
            </span>
          </div>
        </div>
      </Link>

      <CardContent className="flex-1 flex flex-col">
        <Link href={`/story/${adventure.id}`} className="block">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
            {adventure.title}
          </h3>
        </Link>

        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 line-clamp-2 flex-1">
          {adventure.summary}
        </p>

        {adventure.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {adventure.highlights.slice(0, 3).map((highlight, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(adventure.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLike}
              className={cn(
                'flex items-center gap-1 p-1.5 rounded-lg transition-colors',
                displayLiked
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/30'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
              )}
              aria-label={displayLiked ? 'Unlike' : 'Like'}
              aria-pressed={displayLiked}
            >
              <Heart className={cn('w-4 h-4', displayLiked ? 'fill-current' : '')} />
              <span className="font-medium">{displayLikes}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}