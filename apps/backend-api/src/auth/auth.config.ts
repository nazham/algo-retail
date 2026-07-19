import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PostgreSQL pool for Better-Auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const auth = betterAuth({
  database: pool,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // For MVP
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every day
  },

  baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
  secret: process.env.BETTER_AUTH_SECRET as string,

  trustedOrigins: [
    process.env.WEB_ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };

      // Set/update HTTP-only auth-role cookie on sign-in, sign-up, and get-session
      if (
        ctx.path.includes('/sign-in') ||
        ctx.path.includes('/sign-up') ||
        ctx.path.includes('/get-session')
      ) {
        let user: any = null;
        const returned = ctx.context.returned;

        if (returned) {
          if (
            typeof (returned as any).clone === 'function' &&
            typeof (returned as any).json === 'function'
          ) {
            try {
              const clone = (returned as any).clone();
              const data = await clone.json();
              user = data?.user;
            } catch (e) {
              // Ignore parsing errors
            }
          } else if (typeof returned === 'object') {
            user = (returned as any).user;
          }
        }

        // Fallback to request body
        if (!user) {
          const body = ctx.body as any;
          user = body?.user;
        }

        if (user) {
          const role = user.role || 'waitlist';
          ctx.setCookie('auth-role', role, {
            ...cookieOptions,
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }
      }

      // Clear HTTP-only auth-role cookie on sign-out
      if (ctx.path.includes('/sign-out')) {
        ctx.setCookie('auth-role', '', {
          ...cookieOptions,
          maxAge: 0, // Expire immediately
        });
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

export type Session = typeof auth.$Infer.Session;
