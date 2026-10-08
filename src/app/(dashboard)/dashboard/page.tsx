'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, BookOpen, Camera, Image, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AdventureCard } from '@/components/adventure/AdventureCard';
import { StatsCards } from '@/components/adventure/StatsCards';
import { useAuth } from '@/components/providers/AuthProvider';

const statIcons = {
  totalAdventures: BookOpen,
  totalPhotos: Camera,
  totalStories: Image,
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await fetch('/api/user/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      return data.data;
    },
  });

  const { data: adventuresData, isLoading: adventuresLoading } = useQuery({
    queryKey: ['user-adventures', 1],
    queryFn: async () => {
      const res = await fetch('/api/adventures?page=1&limit=5');
      if (!res.ok) throw new Error('Failed to fetch adventures');
      const data = await res.json();
      return data.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Ready for your next adventure?
          </p>
        </div>
        <Link href="/adventures/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Adventure
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="outlined" padding="lg" className="text-center animate-pulse">
              <CardContent className="pt-0">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 mx-auto mb-4" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/adventures/new" className="block">
          <Card variant="outlined" padding="lg" className="text-center hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full">
            <CardContent className="pt-0">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">New Adventure</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload photos & generate story</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/explore" className="block">
          <Card variant="outlined" padding="lg" className="text-center hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full">
            <CardContent className="pt-0">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Explore Stories</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Discover community adventures</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard" className="block">
          <Card variant="outlined" padding="lg" className="text-center hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors h-full">
            <CardContent className="pt-0">
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">All Adventures</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View your complete history</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Adventures */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Recent Adventures</h2>
          <p className="text-slate-600 dark:text-slate-400">Your latest explorations</p>
        </div>
        <Link href="/adventures" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {adventuresLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="outlined" padding="none" className="animate-pulse h-[400px]" />
          ))}
        </div>
      ) : adventuresData?.items?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adventuresData.items.map((adventure: any) => (
            <AdventureCard key={adventure.id} adventure={adventure} />
          ))}
        </div>
      ) : (
        <Card variant="outlined" padding="xl" className="text-center">
          <CardContent>
            <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No adventures yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Start your first exploration journal</p>
            <Link href="/adventures/new">
              <Button size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Adventure
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}