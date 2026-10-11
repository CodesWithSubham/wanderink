'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: '/dashboard',
      });

      if (result.error) {
        setError(result.error.message || 'Sign up failed');
        toast({ title: 'Sign up failed', description: result.error.message || 'Sign up failed', variant: 'error' });
      } else {
        toast({
          title: 'Account created!',
          description: 'Welcome to WanderInk!',
          variant: 'success',
        });
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
      toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak';

  return (
    <div>
      <Card variant="outlined" padding="lg">
        <CardHeader className="text-center mb-8">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start turning walks into stories today</CardDescription>
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
              label="Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Explorer"
              required
              autoComplete="name"
              leftIcon={<User className="w-5 h-5" />}
            />

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

            <Input
              label="Password"
              type="password"
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

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              leftIcon={<Lock className="w-5 h-5" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-slate-600 dark:text-slate-400">
                I agree to the{' '}
                <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}