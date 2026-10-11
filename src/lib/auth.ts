import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET environment variable is not set');
}

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

// Global singleton for MongoDB client to prevent connection exhaustion in development / Turbopack
const globalForMongo = globalThis as unknown as {
  _authMongoClient?: MongoClient;
};

const mongoClient =
  globalForMongo._authMongoClient ??
  new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForMongo._authMongoClient = mongoClient;
}

const authDb = mongoClient.db();

export const auth = betterAuth({
  appName: 'WanderInk',
  baseURL,
  secret,
  basePath: '/api/auth',

  // Database adapter
  database: mongodbAdapter(authDb),

  // Email & Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
    storeSessionInDatabase: true,
  },

  // User configuration
  user: {
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

  // Security & Cookies
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    disableCSRFCheck: false,
    disableOriginCheck: false,
    crossSubDomainCookies: {
      enabled: false,
    },
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      disableIpTracking: false,
    },
    database: {
      generateId: false,
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'database',
    customRules: {
      '/api/auth/sign-in/email': {
        window: 60 * 15,
        max: 5,
      },
      '/api/auth/sign-up/email': {
        window: 60 * 60,
        max: 3,
      },
    },
  },

  trustedOrigins: [baseURL],
});