import { betterAuth, BetterAuthOptions } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// MongoDB connection for Better Auth
// Reuse a single client instance
let mongoClient: MongoClient | null = null;
let authDb: ReturnType<MongoClient['db']> | null = null;

async function getAuthDb() {
  if (authDb) return authDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  mongoClient = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await mongoClient.connect();
  authDb = mongoClient.db();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      authDb = null;
    }
  });

  return authDb;
}

// Initialize auth with async database
let authInstance: Awaited<ReturnType<typeof betterAuth>> | null = null;

export async function getAuth() {
  if (authInstance) return authInstance;

  const db = await getAuthDb();
  const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is not set');
  }

  const config: BetterAuthOptions = {
    // Core configuration
    appName: 'WanderInk',
    baseURL,
    secret,
    basePath: '/api/auth',

    // Database adapter
    database: mongodbAdapter(db),

    // Email & Password authentication (no email verification required)
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true, // Sign in immediately after signup
      // Password reset disabled - no email service
    },

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day - refresh session if older than 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes - cache session in cookie for quick auth checks
      },
      // Store session in database for revocation support
      storeSessionInDatabase: true,
    },

    // User configuration
    user: {
      additionalFields: {
        // name is already included by default, no need to add
      },
      changeEmail: {
        enabled: false,
      },
      deleteUser: {
        enabled: true,
      },
    },

    // Account linking
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github', 'email-password'],
      },
    },

    // Advanced security settings
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      disableCSRFCheck: false,
      disableOriginCheck: false,
      crossSubDomainCookies: {
        enabled: false, // Set to true if using subdomains (e.g., app.example.com, api.example.com)
      },
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
        disableIpTracking: false,
      },
      database: {
        generateId: false, // Use MongoDB ObjectIds
      },
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      window: 60, // 1 minute
      max: 100, // 100 requests per minute
      storage: 'database', // Use database for distributed rate limiting
      customRules: {
        '/api/auth/sign-in/email': {
          window: 60 * 15, // 15 minutes
          max: 5, // 5 attempts per 15 minutes
        },
        '/api/auth/sign-up/email': {
          window: 60 * 60, // 1 hour
          max: 3, // 3 attempts per hour
        },
      },
    },

    // Trusted origins for CSRF protection
    trustedOrigins: [baseURL],
  };

  authInstance = betterAuth(config);
  return authInstance;
}

// Export a promise that resolves to the auth instance
// This allows using `const auth = await getAuth()` in route handlers
export const authPromise = getAuth();

// Export a typed getter for use in route handlers
export async function getAuthInstance() {
  const auth = await authPromise;
  if (!auth) {
    throw new Error('Auth instance not initialized');
  }
  return auth;
}

// Export a proxy that allows using `auth` directly (e.g., auth.api.getSession())
// The proxy waits for the auth instance to be initialized on first use
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    return async (...args: unknown[]) => {
      const instance = await authPromise;
      const fn = (instance as Record<string, unknown>)[prop as string];
      if (typeof fn === 'function') {
        return fn.apply(instance, args);
      }
      return fn;
    };
  },
});