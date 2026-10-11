'use client';

import { useState } from 'react';
import { Compass, Footprints, Camera, BookOpen, ChevronDown, ChevronUp, Sparkles, HeartHandshake } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function FieldJournalGuide() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card variant="outlined" padding="none" className="mb-8 border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 overflow-hidden shadow-xs">
      <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              The Field Journal Ritual
              <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                Mindful Walking
              </span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Presence first, storytelling second. How to make the most of your wander.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label={isOpen ? 'Collapse ritual guide' : 'Expand ritual guide'}
        >
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isOpen && (
        <CardContent className="px-5 pb-6 pt-0 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Step 1 */}
            <div className="rounded-xl p-4 bg-white/80 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Footprints className="w-4 h-4" />
                <span>1. Step Outside</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Take a 15–30 minute walk in a park, neighborhood, or trail. Set phone notifications to silent and keep your phone in your pocket while moving.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl p-4 bg-white/80 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Camera className="w-4 h-4" />
                <span>2. Collect 3–5 Moments</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Pause only when something grabs your eye: tree bark textures, shifting canopy light, curious landmarks, or trail horizons. No people or selfies—just your surroundings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl p-4 bg-white/80 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>3. Synthesize the Memory</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload your curated photos below. WanderInk's vision AI decodes the atmosphere, and the storytelling model crafts your permanent first-person adventure.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100/60 dark:border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Tip: Mix 1 wide landscape shot with 2–3 close-up texture or landmark photos to give the AI rich narrative contrast.
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
