import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create PostgreSQL pool for Better-Auth with explicit connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const auth = betterAuth({
  // Pass Pool instance directly - Better-Auth auto-detects PostgreSQL
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
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'your-secret-key-change-in-production-MUST-BE-AT-LEAST-32-CHARS',

  trustedOrigins: [
    process.env.WEB_ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3001',
  ],

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'MANAGER',
      },
      tenantIds: {
        type: 'string', // Store as JSON string to avoid PG array issues
        defaultValue: '[]',
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
