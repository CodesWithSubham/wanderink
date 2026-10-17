'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ImageAnalysisSummary } from '@/types/api';
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  Eye,
  ImageIcon,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface GenerationProgressProps {
  adventureId: string;
  onComplete: (redirectUrl: string) => void;
  onError: (error: string) => void;
  /** Optional local previews of the uploaded photos, used as thumbnails. */
  imagePreviews?: string[];
}

type ImageStatus = 'pending' | 'analyzing' | 'done' | 'failed';

interface ImageState {
  status: ImageStatus;
  analysis?: ImageAnalysisSummary;
}

const WAITING_LINES = [
  'Reading the light, colour and composition...',
  'Looking for landmarks and fine detail...',
  'Measuring the mood of the moment...',
  'Noticing textures most people walk past...',
];

const STORY_LINES = [
  'Finding the right words for your journey...',
  'Weaving memories into a narrative...',
  'Shaping the opening scene...',
  'Adding that touch of wanderlust magic...',
];

export function GenerationProgress({
  adventureId,
  onComplete,
  onError,
  imagePreviews,
}: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<ImageState[]>([]);
  const [imageCount, setImageCount] = useState(0);
  const [storyTitle, setStoryTitle] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);
  const startedAtRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectSSE = useCallback(() => {
    closeStream();
    completedRef.current = false;

    const eventSource = new EventSource(`/api/adventures/${adventureId}/generate`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('vision_start', (e) => {
      const data = JSON.parse(e.data) as { totalImages: number };
      startedAtRef.current = Date.now();
      setCurrentStep(0);
      setImageCount(data.totalImages);
      setStoryTitle(null);
      setElapsed(0);
      setImages(
        Array.from({ length: data.totalImages }, (_, index) => ({
          status: index === 0 ? 'analyzing' : 'pending',
        })) as ImageState[]
      );
    });

    eventSource.addEventListener('vision_progress', (e) => {
      const data = JSON.parse(e.data) as {
        completed: number;
        total: number;
        imageIndex: number;
        analysis?: ImageAnalysisSummary;
        failed?: boolean;
      };

      setImageCount(data.total);
      setImages((previous) => {
        const next = [...previous];
        while (next.length < data.total) next.push({ status: 'pending' });

        next[data.imageIndex] = data.failed
          ? { status: 'failed' }
          : { status: 'done', analysis: data.analysis };

        const nextIndex = data.imageIndex + 1;
        if (next[nextIndex]) next[nextIndex] = { status: 'analyzing' };

        return next;
      });
    });

    eventSource.addEventListener('vision_complete', () => {
      setImages((previous) =>
        previous.map((image) =>
          image.status === 'failed' ? image : { ...image, status: 'done' as const }
        )
      );
      setCurrentStep(1);
    });

    eventSource.addEventListener('story_start', () => {
      setCurrentStep(1);
    });

    eventSource.addEventListener('story_complete', (e) => {
      try {
        const data = JSON.parse(e.data) as { title?: string };
        if (data.title) setStoryTitle(data.title);
      } catch {
        // the title is a nice-to-have only
      }
    });

    eventSource.addEventListener('done', (e) => {
      const data = JSON.parse(e.data) as { redirectUrl: string };
      completedRef.current = true;
      closeStream();
      onCompleteRef.current(data.redirectUrl);
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      // Server-sent generation errors carry a payload; transport failures do not.
      if (e.data) {
        try {
          const data = JSON.parse(e.data) as { message?: string };
          const message = data.message || 'Generation failed';
          completedRef.current = true;
          closeStream();
          setError(message);
          onErrorRef.current(message);
        } catch {
          // ignore malformed payloads
        }
      }
    });

    eventSource.onerror = () => {
      // The stream ending without a `done` event means we lost the connection.
      if (completedRef.current) return;
      if (eventSource.readyState === EventSource.CLOSED) {
        closeStream();
        const message = 'Lost connection while generating your story. Please try again.';
        setError(message);
        onErrorRef.current(message);
      }
    };
  }, [adventureId, closeStream]);

  // Keep the elapsed timer and rotating hints fresh.
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      setTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    connectSSE();
    return closeStream;
  }, [connectSSE, closeStream]);

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">
          Generation Failed
        </h3>
        <p className="mb-6 text-slate-600 dark:text-slate-400">{error}</p>
        <button
          onClick={() => {
            setError(null);
            connectSSE();
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const analyzedCount = images.filter((image) => image.status === 'done').length;
  const total = imageCount || images.length || 0;
  const hintIndex = Math.floor(tick / 4) % WAITING_LINES.length;
  const overallPercent =
    total === 0
      ? 5
      : currentStep === 0
        ? Math.max(5, Math.round(((analyzedCount + 0.35) / total) * 55))
        : 65;

  const steps = [
    { id: 'vision', label: 'Analyzing photos', icon: Eye },
    { id: 'story', label: 'Writing your story', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Step timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        {steps.map((step, index) => (
          <div key={step.id} className="relative pb-8 pl-16 last:pb-0">
            <div
              className={cn(
                'absolute left-6 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                index < currentStep
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : index === currentStep
                    ? 'animate-pulse border-emerald-600 bg-white text-emerald-600 dark:bg-slate-900'
                    : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900'
              )}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <div className="ml-4">
              <p
                className={cn(
                  'font-medium',
                  index <= currentStep
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {step.label}
              </p>
              {step.id === 'vision' && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {analyzedCount}/{total || '—'} images analyzed
                </p>
              )}
              {step.id === 'story' && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {currentStep === 0
                    ? 'Waiting for the photo analysis'
                    : storyTitle
                      ? `Drafting “${storyTitle}”`
                      : 'Weaving your notes into a journal entry'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current activity */}
      <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            {currentStep === 0 ? (
              <Eye className="h-5 w-5 text-emerald-600" />
            ) : (
              <BookOpen className="h-5 w-5 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {currentStep === 0 ? 'Analyzing your photos...' : 'Crafting your story...'}
            </h3>
            <p className="truncate text-sm text-slate-600 dark:text-slate-400">
              {currentStep === 0
                ? total > 0
                  ? `Photo ${Math.min(analyzedCount + 1, total)} of ${total} · ${WAITING_LINES[hintIndex]}`
                  : 'Preparing your photos...'
                : storyTitle
                  ? `“${storyTitle}” · ${STORY_LINES[hintIndex]}`
                  : STORY_LINES[hintIndex]}
            </p>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {elapsed}s
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Per-photo observations */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <Camera className="h-4 w-4 text-emerald-600" />
            What the AI sees in your photos
          </div>

          <ul className="space-y-2">
            {images.map((image, index) => {
              const preview = imagePreviews?.[index];
              const isActive = image.status === 'analyzing';

              return (
                <li
                  key={index}
                  className={cn(
                    'flex gap-3 rounded-xl border p-3 transition-colors',
                    isActive
                      ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40'
                  )}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className={cn(
                          'h-full w-full object-cover transition-opacity',
                          image.status === 'pending' && 'opacity-40'
                        )}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Photo {index + 1}
                      </span>
                      {image.status === 'analyzing' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <Sparkles className="h-3 w-3" />
                          analyzing
                        </span>
                      )}
                      {image.status === 'pending' && (
                        <span className="text-xs text-slate-400">queued</span>
                      )}
                      {image.status === 'failed' && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          skipped
                        </span>
                      )}
                    </div>

                    {image.analysis ? (
                      <>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {image.analysis.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {image.analysis.mood && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              mood · {image.analysis.mood}
                            </span>
                          )}
                          {image.analysis.scenes.slice(0, 2).map((scene) => (
                            <span
                              key={scene}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {scene}
                            </span>
                          ))}
                          {image.analysis.objects.slice(0, 3).map((object) => (
                            <span
                              key={object}
                              className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            >
                              {object}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p
                        className={cn(
                          'text-sm',
                          isActive
                            ? 'animate-pulse text-slate-500 dark:text-slate-400'
                            : 'text-slate-400 dark:text-slate-500'
                        )}
                      >
                        {isActive
                          ? WAITING_LINES[hintIndex]
                          : image.status === 'failed'
                            ? 'This photo could not be read, continuing with the rest.'
                            : 'Waiting to be examined...'}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        {currentStep === 0
          ? 'Every photo is read individually — this usually takes 15-30 seconds.'
          : 'Almost there — the final draft is being written.'}
      </p>
    </div>
  );
}
