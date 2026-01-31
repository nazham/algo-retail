CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products" ("sku");
CREATE INDEX IF NOT EXISTS "products_tenant_id_idx" ON "products" ("tenant_id");
