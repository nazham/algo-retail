CREATE UNIQUE INDEX IF NOT EXISTS "tenant_sku_idx" ON "products" ("tenant_id", "sku");
