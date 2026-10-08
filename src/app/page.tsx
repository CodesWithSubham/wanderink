import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Compass, BookOpen, Sparkles, Image, Feather, Mountain, Sun, Moon, Star } from 'lucide-react';

const features = [
  {
    icon: Image,
    title: 'Upload Photos',
    description: 'Drag and drop 3-5 photos from your walk. Our client-side compression keeps uploads fast and private.',
  },
  {
    icon: Sparkles,
    title: 'AI Analysis',
    description: 'Vision AI analyzes your images for objects, scenes, mood, and notable details - all through your self-hosted OmniRoute.',
  },
  {
    icon: BookOpen,
    title: 'Personal Story',
    description: 'Get a beautifully written exploration journal with title, summary, full story, and highlights - crafted by AI.',
  },
  {
    icon: Compass,
    title: 'Share & Explore',
    description: 'Publish publicly to the gallery or keep private. Browse others\' adventures and get inspired for your next walk.',
  },
];

const steps = [
  { number: '01', title: 'Go Outside', description: 'Take a walk, explore your neighborhood, visit a park, or hike a trail.' },
  { number: '02', title: 'Capture Moments', description: 'Snap 3-5 photos of interesting discoveries - no people, just the world around you.' },
  { number: '03', title: 'Upload & Generate', description: 'Upload to WanderInk and watch AI transform your photos into a story in real-time.' },
  { number: '04', title: 'Read & Share', description: 'Enjoy your personal adventure journal. Keep it private or share with the community.' },
];

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now with real-time AI generation progress
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6 animate-slide-up font-serif">
              Every walk{' '}
              <span className="text-emerald-600 dark:text-emerald-400">becomes a story</span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Upload 3-5 photos from your outdoor adventures. Our AI transforms them into beautiful, personalized exploration journals.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link href="/signup">
                <Button size="xl" className="w-full sm:w-auto px-8 py-4 text-lg">
                  Start Your First Adventure
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="xl" className="w-full sm:w-auto px-8 py-4 text-lg">
                  Explore Stories
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating cards decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/4 left-10 w-64 h-64 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl animate-pulse-soft" />
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 font-serif">
              How it works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Four simple steps to turn your outdoor moments into lasting memories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={step.number} variant="outlined" padding="lg" className="relative animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{step.number}</span>
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 font-serif">
              Built for explorers
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Every feature designed to keep you outside, not staring at screens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} variant="outlined" padding="lg" className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech highlights */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 font-serif">
              Privacy-first architecture
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Your data stays yours. Self-hosted AI, encrypted storage, and no tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Mountain className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold">Self-hosted AI</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Run Qwen and Gemma models on your own Oracle VM via OmniRoute. No data leaves your infrastructure.
              </p>
            </Card>

            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold">Cloudflare R2 Storage</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Images stored in your R2 bucket with signed URLs for private adventures. Public CDN for gallery performance.
              </p>
            </Card>

            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Star className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold">Zero Tracking</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                No analytics cookies, no third-party scripts. Just Vercel Analytics (privacy-friendly) if you enable it.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Card variant="elevated" padding="xl" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 dark:from-emerald-900/20 dark:to-emerald-900/10" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 font-serif">
                Ready for your first adventure?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Create your account and start turning walks into stories today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="xl" className="w-full sm:w-auto px-8 py-4 text-lg">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto px-8 py-4 text-lg border-slate-300 dark:border-slate-600">
                    Browse Stories First
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}