'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'enter' | 'sent'>('enter');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectURL: '/reset-password' }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setStep('sent');
      toast({ title: 'Email sent!', description: 'Check your inbox for the password reset link', variant: 'success' });
    } catch {
      setError('Failed to send reset email. Please try again.');
      toast({ title: 'Error', description: 'Failed to send reset email', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div>
        <Card variant="outlined" padding="lg" className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We've sent a password reset link to {email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setStep('enter')} className="flex-1">
                Change Email
              </Button>
              <Button onClick={handleSubmit} loading={loading} className="flex-1">
                {loading ? 'Resending...' : 'Resend Email'}
              </Button>
            </div>
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 text-sm">
              ← Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card variant="outlined" padding="lg">
        <CardHeader className="text-center mb-8">
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
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