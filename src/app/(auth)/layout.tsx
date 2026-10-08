import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Decorative sidebar */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 flex-col justify-between relative overflow-hidden">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12" aria-label="WanderInk Home">
            <svg className="w-10 h-10 text-white" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M16 8V24" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14H24" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="text-2xl font-bold text-white">WanderInk</span>
          </Link>
        </div>

        <div className="text-white max-w-md">
          <h2 className="text-4xl font-bold font-serif mb-6">Every walk becomes a story</h2>
          <p className="text-emerald-100 text-lg leading-relaxed mb-8">
            Transform your outdoor explorations into beautiful, AI-powered journals. Upload 3-5 photos and get a personalized adventure story.
          </p>

          <div className="space-y-4">
            {[
              '📸 Snap photos on your walk',
              '🤖 AI analyzes & writes your story',
              '📖 Read & share your adventure',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 text-emerald-100">
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">{index + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-emerald-200 text-sm">
          <p>Privacy-first • Self-hosted AI • No tracking</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}