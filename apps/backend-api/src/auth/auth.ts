import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
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
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'your-secret-key-change-in-production-MUST-BE-AT-LEAST-32-CHARS',
  // 🟢 Allow cookies from your Next.js frontend
  trustedOrigins: [
    process.env.WEB_ADMIN_URL || 'http://localhost:3000',
    'http://localhost:3001',
  ],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'admin',
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
