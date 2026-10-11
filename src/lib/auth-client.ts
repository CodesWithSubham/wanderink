import { createAuthClient } from 'better-auth/react';

// Get base URL from environment or fallback
const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const _authClient = createAuthClient({
  baseURL,
  basePath: '/api/auth',

  // Fetch options
  fetchOptions: {
    credentials: 'include', // Always include cookies
  },

  // Session configuration
  session: {
    // How often to refresh the session in the background (in seconds)
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    // Update session if it's older than this (in seconds)
    updateAge: 60 * 60 * 24, // 1 day
  },

  // Callbacks
  callbacks: {
    onSession: (session: unknown) => {
      // Called when session is fetched
      return session;
    },
    onSignIn: (user: unknown) => {
      // Called after successful sign in
      console.log('User signed in:', (user as { email?: string }).email);
    },
    onSignOut: () => {
      // Called after sign out
      console.log('User signed out');
    },
  },
});

export const authClient = _authClient as ReturnType<typeof createAuthClient>;

// Export types for use in components
export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;