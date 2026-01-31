-- Migration: Fix tenantIds column to use TEXT instead of TEXT[]
ALTER TABLE "user" DROP COLUMN IF EXISTS "tenantIds";
ALTER TABLE "user" ADD COLUMN "tenantIds" TEXT DEFAULT '[]';
