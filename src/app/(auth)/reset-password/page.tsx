'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { SuspenseWrapper } from '@/components/ui/SuspenseWrapper';

export const dynamic = 'force-dynamic';

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'reset' | 'success'>('reset');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep('success');
      toast({ title: 'Password reset!', description: 'Your password has been updated successfully', variant: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      toast({ title: 'Error', description: 'Failed to reset password', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div>
        <Card variant="outlined" padding="lg" className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Password Reset!</CardTitle>
            <CardDescription>Your password has been updated successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div>
        <Card variant="outlined" padding="lg" className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>This password reset link is invalid or has expired</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password">
              <Button variant="outline" size="lg">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordStrength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak';

  return (
    <div>
      <Card variant="outlined" padding="lg">
        <CardHeader className="text-center mb-8">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>Enter a new password for your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}

            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                leftIcon={<Lock className="w-5 h-5" />}
                helperText={
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {['weak', 'medium', 'strong'].map((level, i) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1.5 flex-1 rounded',
                            passwordStrength === level ||
                            (passwordStrength === 'strong' && level !== 'strong') ||
                            (passwordStrength === 'medium' && level === 'weak')
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {passwordStrength === 'weak' && 'Use at least 8 characters'}
                      {passwordStrength === 'medium' && 'Good password'}
                      {passwordStrength === 'strong' && 'Strong password'}
                    </p>
                  </div>
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              leftIcon={<Lock className="w-5 h-5" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700">
              ← Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <SuspenseWrapper>
      <ResetPasswordPageContent />
    </SuspenseWrapper>
  );
}