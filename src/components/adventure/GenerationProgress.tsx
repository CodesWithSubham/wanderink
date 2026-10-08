'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, Eye, BookOpen, Sparkles, AlertCircle } from 'lucide-react';

interface GenerationProgressProps {
  adventureId: string;
  onComplete: (redirectUrl: string) => void;
  onError: (error: string) => void;
}

const steps = [
  { id: 'vision', label: 'Analyzing photos', icon: Eye, total: 3 },
  { id: 'story', label: 'Writing your story', icon: BookOpen, total: 1 },
];

export function GenerationProgress({ adventureId, onComplete, onError }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visionProgress, setVisionProgress] = useState({ completed: 0, total: 3 });
  const [storyProgress, setStoryProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connectSSE = useCallback(() => {
    const eventSource = new EventSource(`/api/adventures/${adventureId}/generate`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('vision_start', (e) => {
      const data = JSON.parse(e.data);
      setCurrentStep(0);
      setVisionProgress({ completed: 0, total: data.totalImages });
    });

    eventSource.addEventListener('vision_progress', (e) => {
      const data = JSON.parse(e.data);
      setVisionProgress({ completed: data.completed, total: data.total });
    });

    eventSource.addEventListener('vision_complete', (e) => {
      setVisionProgress({ completed: visionProgress.total, total: visionProgress.total });
      setCurrentStep(1);
      setStoryProgress(true);
    });

    eventSource.addEventListener('story_start', () => {
      setStoryProgress(true);
    });

    eventSource.addEventListener('story_complete', () => {
      setStoryProgress(true);
    });

    eventSource.addEventListener('done', (e) => {
      const data = JSON.parse(e.data);
      eventSource.close();
      eventSourceRef.current = null;
      onComplete(data.redirectUrl);
    });

    eventSource.addEventListener('error', (e: MessageEvent) => {
      if (e.data) {
        const data = JSON.parse(e.data);
        setError(data.message);
        eventSource.close();
        eventSourceRef.current = null;
        onError(data.message);
      }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSourceRef.current = null;
      }
    };
  }, [adventureId, onComplete, onError, visionProgress.total]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connectSSE]);

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          Generation Failed
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => {
            setError(null);
            connectSSE();
          }}
          className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        {steps.map((step, index) => (
          <div key={step.id} className="relative pl-16 pb-8 last:pb-0">
            <div className={cn(
              'absolute left-6 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
              index < currentStep
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : index === currentStep
                ? 'bg-white border-emerald-600 text-emerald-600 animate-pulse'
                : 'bg-white border-slate-300 dark:border-slate-600 text-slate-400'
            )}>
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <div className="ml-4">
              <p className={cn(
                'font-medium',
                index <= currentStep ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              )}>
                {step.label}
              </p>
              {step.id === 'vision' && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {visionProgress.completed}/{visionProgress.total} images analyzed
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Activity */}
      <div className={cn('p-6 rounded-xl transition-colors', currentStep === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800')}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            currentStep === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-700'
          )}>
            {currentStep === 0 ? (
              <Eye className="w-6 h-6 text-emerald-600" />
            ) : (
              <BookOpen className="w-6 h-6 text-slate-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {currentStep === 0 ? 'Analyzing your photos...' : 'Crafting your story...'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {currentStep === 0
                ? `Processing image ${visionProgress.completed} of ${visionProgress.total}`
                : 'Our AI travel writer is weaving your adventure into a beautiful journal'}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{
              width: currentStep === 0
                ? `${(visionProgress.completed / visionProgress.total) * 100}%`
                : storyProgress
                ? '100%'
                : '50%',
            }}
          />
        </div>
      </div>

      {/* Fun waiting messages */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse-soft">
        {currentStep === 0 && [
          'Spotting hidden details in your photos...',
          'Identifying that perfect golden hour lighting...',
          'Noticing the texture of that ancient tree bark...',
        ][Math.floor(Date.now() / 3000) % 3]}
        {currentStep === 1 && [
          'Finding the right words for your journey...',
          'Weaving memories into a narrative...',
          'Adding that touch of wanderlust magic...',
        ][Math.floor(Date.now() / 3000) % 3]}
      </div>
    </div>
  );
}