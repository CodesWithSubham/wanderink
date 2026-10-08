'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'enter' | 'sent' | 'verified'>('enter');
  const [error, setError] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, callbackURL: '/dashboard' }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      setStep('sent');
      toast({ title: 'Email sent!', description: 'Check your inbox for the verification link', variant: 'success' });
    } catch {
      setError('Failed to send verification email. Please try again.');
      toast({ title: 'Error', description: 'Failed to send verification email', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verified') {
    return (
      <div>
        <Card variant="outlined" padding="lg" className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>Your account is ready. Welcome to WanderInk!</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
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
          <CardTitle className="text-2xl">{step === 'enter' ? 'Verify your email' : 'Check your inbox'}</CardTitle>
          <CardDescription>
            {step === 'enter'
              ? 'Enter your email to receive a verification link'
              : 'We\'ve sent a verification link to your email'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResend} className="space-y-4">
            {step === 'enter' && (
              <>
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  leftIcon={<Mail className="w-5 h-5" />}
                />

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  {loading ? 'Sending...' : 'Send Verification Email'}
                </Button>
              </>
            )}

            {step === 'sent' && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  We've sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Check your inbox (and spam folder) and click the link to verify your account.
                </p>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setStep('enter')} className="flex-1">
                    Change Email
                  </Button>
                  <Button onClick={handleResend} loading={loading} className="flex-1">
                    {loading ? 'Resending...' : 'Resend Email'}
                  </Button>
                </div>

                <p className="text-xs text-slate-400">
                  Didn't receive it? The link expires in 24 hours.
                </p>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700">
                ← Back to Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}