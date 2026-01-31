-- Migration: Add Tenants Table, Better-Auth Tables, and SKU Sequence
-- MVP Strategy: Keep "Different Batch = Different SKU" approach
-- Product batches will be separate products with parent_id linking (existing schema)
-- Run: pnpm db:push or drizzle-kit migrate

-- 1. TENANTS TABLE (with config JSONB for receipt data)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'FREE',
  max_products INTEGER DEFAULT 1000,
  max_pos_terminals INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}', -- Store receipt info, branding, feature flags
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_active ON tenants(is_active);

COMMENT ON TABLE tenants IS 'Multi-tenant table with config JSONB for receipt/store data';

-- 2. BETTER-AUTH TABLES (managed by Better-Auth)
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Custom fields for multi-tenant support
  role TEXT DEFAULT 'MANAGER', -- ADMIN or MANAGER
  tenant_ids TEXT[] DEFAULT '{}' -- Array of tenant IDs user has access to
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,
  password TEXT, -- For credentials provider
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_account_user_id ON account(user_id);

-- 3. IN-HOUSE SKU SEQUENCE (for products without barcodes)
CREATE SEQUENCE IF NOT EXISTS in_house_sku_seq START 10000;

-- Function to generate EAN-13 compatible SKU
CREATE OR REPLACE FUNCTION generate_in_house_sku()
RETURNS TEXT AS $$
BEGIN
  -- Format: 99YYMMDDSSSSS (13 digits, EAN-13 compatible)
  -- Prefix 99 = in-house items (distinguishable from standard EAN-13)
  RETURN '99' || 
         TO_CHAR(CURRENT_DATE, 'YYMMDD') || 
         LPAD(nextval('in_house_sku_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_in_house_sku() IS 'Generates EAN-13 compatible SKU for in-house products';

-- 4. ADD INDEXES TO EXISTING PRODUCTS TABLE (performance optimization)
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date) WHERE expiry_date IS NOT NULL;

-- NOTE: Product batches handled via existing schema
-- Different batches = different products with same name but different SKUs
-- Use parent_id for variant/batch relationships
-- Will migrate to separate product_batches table in post-MVP phase
