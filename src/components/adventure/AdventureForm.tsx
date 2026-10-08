'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageUploader } from './ImageUploader';
import { GenerationProgress } from './GenerationProgress';
import { Tabs } from '@/components/ui/Tabs';

type Step = 'upload' | 'review' | 'generating';

interface AdventureFormProps {
  onSuccess?: (adventureId: string) => void;
}

export function AdventureForm({ onSuccess }: AdventureFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [uploadedImages, setUploadedImages] = useState<Array<{ key: string; preview: string; originalName: string }>>([]);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [generationAdventureId, setGenerationAdventureId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = useCallback(async (results: Array<{ key: string; preview: string; originalName: string }>) => {
    setUploadedImages(results);
    setStep('review');
    setError(null);
  }, []);

  const handleUploadError = useCallback((error: string) => {
    setError(error);
  }, []);

  const handleCreateAdventure = useCallback(async () => {
    if (uploadedImages.length < 3) return;

    try {
      setError(null);
      const response = await fetch('/api/adventures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageKeys: uploadedImages.map((img) => img.key),
          visibility,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create adventure');
      }

      const { data: adventure } = await response.json();
      setGenerationAdventureId(adventure.id);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create adventure');
    }
  }, [uploadedImages, visibility]);

  const handleGenerationComplete = useCallback((redirectUrl: string) => {
    const adventureId = redirectUrl.split('/').pop();
    if (adventureId && onSuccess) {
      onSuccess(adventureId);
    }
    router.push(redirectUrl);
  }, [onSuccess, router]);

  const handleGenerationError = useCallback((error: string) => {
    setError(error);
    setStep('review');
  }, []);

  const goBack = useCallback(() => {
    if (step === 'review') setStep('upload');
    else if (step === 'generating') setStep('review');
  }, [step]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Step 1: Upload Photos
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Select 3-5 photos from your walk. We'll compress them locally before uploading.
        </p>
      </div>

      <ImageUploader
        maxFiles={5}
        onUploadComplete={handleUploadComplete}
        onError={handleUploadError}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
          <p className="text-rose-700 dark:text-rose-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Step 2: Review & Confirm
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Your images are ready. Choose visibility and generate your story.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {uploadedImages.map((img, index) => (
          <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img src={img.preview} alt={img.originalName} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="visibility"
            value="private"
            checked={visibility === 'private'}
            onChange={() => setVisibility('private')}
            className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Private</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Only you can see this adventure</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="visibility"
            value="public"
            checked={visibility === 'public'}
            onChange={() => setVisibility('public')}
            className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
          />
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Public</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Share with the WanderInk community</p>
          </div>
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
          <p className="text-rose-700 dark:text-rose-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleCreateAdventure} className="flex-1">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Story
        </Button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => {
    if (!generationAdventureId) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Step 3: AI is Working
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            This usually takes 15-30 seconds. We'll redirect you when it's ready.
          </p>
        </div>

        <GenerationProgress
          adventureId={generationAdventureId}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      </div>
    );
  };

  return (
    <Card variant="outlined" padding="lg" className="max-w-3xl mx-auto">
      <CardHeader className="mb-6">
        <CardTitle className="text-2xl">Create New Adventure</CardTitle>
        <p className="text-slate-600 dark:text-slate-400">
          Turn your photos into a beautiful exploration journal
        </p>
      </CardHeader>

      <div className="mb-8">
        <Tabs defaultValue="upload">
          <Tabs.List className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full">
            <Tabs.Trigger value="upload" disabled={step !== 'upload' && step !== 'review'}>
              <span className="flex items-center gap-2">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium', step === 'upload' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}>1</span>
                Upload
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="review" disabled={step === 'generating'}>
              <span className="flex items-center gap-2">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium', step === 'review' ? 'bg-emerald-600 text-white' : step === 'generating' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}>2</span>
                Review
              </span>
            </Tabs.Trigger>
            <Tabs.Trigger value="generating">
              <span className="flex items-center gap-2">
                <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium', step === 'generating' ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-500')}>3</span>
                Generate
              </span>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      <CardContent>
        {step === 'upload' && renderUploadStep()}
        {step === 'review' && renderReviewStep()}
        {step === 'generating' && renderGeneratingStep()}
      </CardContent>
    </Card>
  );
}