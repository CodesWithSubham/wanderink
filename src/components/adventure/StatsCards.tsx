'use client';

import { Camera, BookOpen, Image, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';

interface StatsCardsProps {
  stats: {
    totalAdventures: number;
    totalPhotos: number;
    totalStories: number;
  };
}

const statItems = [
  {
    key: 'totalAdventures',
    label: 'Adventures',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    key: 'totalPhotos',
    label: 'Photos Uploaded',
    icon: Camera,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  },
  {
    key: 'totalStories',
    label: 'Stories Generated',
    icon: Image,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {statItems.map((item) => (
        <Card key={item.key} variant="outlined" padding="lg" className="text-center">
          <CardContent className="pt-0">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4', item.color)}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats[item.key as keyof typeof stats].toLocaleString()}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {item.label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}