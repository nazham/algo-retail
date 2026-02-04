-- Inventory Movements Table (Immutable Ledger)
-- Records all stock changes for full audit trail

-- Movement type enum
DO $$ BEGIN
  CREATE TYPE movement_type AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adjustment reason enum
DO $$ BEGIN
  CREATE TYPE adjustment_reason AS ENUM ('DAMAGED', 'EXPIRED', 'THEFT', 'COUNT_ERROR', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  quantity REAL NOT NULL,                  -- Signed: +50 for in, -5 for out
  cost_price INTEGER,                      -- Snapshot at time of movement (cents)
  reason adjustment_reason,                -- Only for ADJUSTMENT type
  remarks TEXT,
  reference_id UUID,                       -- Link to order_id or batch_id
  user_id TEXT,                            -- Who made this change
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_tenant ON inventory_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at DESC);
