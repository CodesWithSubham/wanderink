import Link from 'next/link';

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="WanderInk Home">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M16 8V24" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 14H24" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">WanderInk</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 max-w-xs">
              Every walk becomes a story. Transform your outdoor explorations into beautiful, AI-powered journals.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Explore</h3>
            <nav aria-label="Explore links">
              <ul className="space-y-2">
                <li><Link href="/explore" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Public Stories</Link></li>
                <li><Link href="/explore?sort=popular" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Most Popular</Link></li>
                <li><Link href="/explore?sort=mood" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">By Mood</Link></li>
              </ul>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Account</h3>
            <nav aria-label="Account links">
              <ul className="space-y-2">
                <li><Link href="/login" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Sign Up</Link></li>
                <li><Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Dashboard</Link></li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            &copy; {CURRENT_YEAR} WanderInk. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-slate-500 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-slate-500 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}