'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Sun, Moon, LogOut, User, Plus, BookOpen, Compass } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from 'next-themes';
import { useAuth, AuthGuard } from '@/components/providers/AuthProvider';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, signOut, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/dashboard', label: 'Dashboard', icon: BookOpen, protected: true },
    { href: '/adventures/new', label: 'New Adventure', icon: Plus, protected: true },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2" aria-label="WanderInk Home">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M16 8V24" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 14H24" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">WanderInk</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <AuthGuard key={item.href} fallback={null}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-4 h-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </AuthGuard>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
            </Button>

            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <Avatar src={user.image ?? undefined} alt={user.name} fallback={user.name} size="sm" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" className="w-48">
                  <DropdownMenu.Label className="px-4 py-1">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.image ?? undefined} alt={user.name} fallback={user.name} size="sm" />
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item asChild>
                    <Link href="/dashboard" className="w-full">
                      <User className="w-4 h-4" aria-hidden="true" />
                      Dashboard
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/adventures/new" className="w-full">
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      New Adventure
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onClick={signOut} className="text-rose-600">
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Sign Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 animate-slide-down">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <AuthGuard key={item.href} fallback={null}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </AuthGuard>
              ))}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}