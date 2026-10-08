'use client';

import { useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, Loader2, Heart, Eye, MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AdventureCard } from '@/components/adventure/AdventureCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { SuspenseWrapper } from '@/components/ui/SuspenseWrapper';

type SortOption = 'newest' | 'popular' | 'mood';

function ExplorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest';

  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    params.set('sort', sort);
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const handleSortChange = (newSort: string) => {
    const sortValue = newSort as SortOption;
    setSort(sortValue);
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortValue);
    if (search) params.set('search', search);
    router.push(`/explore?${params.toString()}`, { scroll: false });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ['public-adventures', debouncedSearch, sort],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '12',
        sort,
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/adventures/public?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch adventures');
      return res.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.data.hasMore) {
        return (lastPage.data.page || 1) + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const adventures = data?.pages.flatMap((page) => page.data.items) || [];
  const total = data?.pages[0]?.data.total || 0;

  const handleLike = async (adventureId: string) => {
    try {
      await fetch(`/api/adventures/${adventureId}/like`, { method: 'POST' });
    } catch {
      // Error handled by toast
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif">Explore Stories</h1>
          <p className="text-slate-600 dark:text-slate-400">Discover adventures from the community</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} variant="outlined" padding="none" className="animate-pulse h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Card variant="outlined" padding="xl">
          <p className="text-rose-600">Failed to load adventures. Please try again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif">Explore Stories</h1>
            <p className="text-slate-600 dark:text-slate-400">Discover adventures from the community</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search stories..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>
        </div>

        {/* Sort Tabs */}
        <Tabs defaultValue={sort} onValueChange={handleSortChange}>
          <Tabs.List className="w-full sm:w-auto">
            <Tabs.Trigger value="newest">Newest</Tabs.Trigger>
            <Tabs.Trigger value="popular">Most Liked</Tabs.Trigger>
            <Tabs.Trigger value="mood">Best Mood</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total} {total === 1 ? 'story' : 'stories'} found
        </p>
      </div>

      {/* Adventures Grid */}
      {adventures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="adventures-grid">
          {adventures.map((adventure: any) => (
            <AdventureCard
              key={adventure.id}
              adventure={adventure}
              onLike={() => handleLike(adventure.id)}
            />
          ))}

          {/* Load More Trigger */}
          {hasNextPage && (
            <div className="col-span-full flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full max-w-xs"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading more...
                  </>
                ) : (
                  'Load More Stories'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card variant="outlined" padding="xl" className="text-center">
          <CardContent>
            <Eye className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No stories found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {debouncedSearch
                ? 'Try adjusting your search or filters'
                : 'Be the first to share an adventure!'}
            </p>
            {!debouncedSearch && (
              <a href="/adventures/new">
                <Button size="lg">
                  Create Your First Adventure
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <SuspenseWrapper>
      <ExplorePageContent />
    </SuspenseWrapper>
  );
}