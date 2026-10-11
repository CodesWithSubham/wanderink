'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient } from '@/lib/auth-client';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const { data, error } = await authClient.getSession();
      if (data) {
        setSession(data as Session);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchSession();

    // Listen for auth changes via storage event (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'better-auth.session' || e.key === 'better-auth.session.sig') {
        if (mounted) fetchSession();
      }
    };

    // Also listen for custom auth events
    const handleAuthChange = () => {
      if (mounted) fetchSession();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('better-auth:session-change', handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('better-auth:session-change', handleAuthChange);
    };
  }, []);

  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);
      // Dispatch event for other tabs
      window.dispatchEvent(new Event('better-auth:session-change'));
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const refetchSession = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        isLoading,
        isAuthenticated: !!session?.user,
        signOut,
        refetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Please sign in to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function GuestGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">You are already signed in.</p>
      </div>
    );
  }

  return <>{children}</>;
}