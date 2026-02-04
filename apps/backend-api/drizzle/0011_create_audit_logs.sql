CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL,
    "user_id" text NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" uuid NOT NULL,
    "action" text NOT NULL,
    "payload" jsonb,
    "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_audit_tenant_entity" ON "audit_logs" ("tenant_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_audit_created_at" ON "audit_logs" ("created_at");
