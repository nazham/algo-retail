import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema'; // Import your updated schema
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a direct connection pool for Better Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
  secret: process.env.BETTER_AUTH_SECRET as string, // 🟢 Enforce secret via env var
  // 🟢 Allow cookies from your Next.js frontend
  trustedOrigins: [
    process.env.WEB_ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3000', // Explicitly trust localhost:3000 for local dev against remote backend
    'http://localhost:3001',
  ],
  advanced: {
    // 🟢 Ensure cookies are set correctly for our Proxy/Rewrite setup
    // When proxying, the browser sees the request as coming from the frontend domain.
    // We want the cookie to be set on the frontend domain (or have no specific domain set, defaulting to Host).
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Only run for sign-in and sign-up paths
      if (ctx.path.includes('/sign-in') || ctx.path.includes('/sign-up')) {
        // Access the response body to get user data
        const body = ctx.body as any;
        const user = body?.user;
        if (user) {
          const role = user.role || 'waitlist';
          ctx.setCookie('auth-role', role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }
      }
    }),
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'waitlist',
      },
      pin: {
        type: 'string',
        required: false,
      },
      tenantId: {
        type: 'string',
        required: false,
      },
    },
  },
});
