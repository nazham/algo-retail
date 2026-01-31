-- Migration: Add SKU Sequence Table
-- Purpose: Auto-generate EAN-13 compatible SKUs for products without barcode
-- Format: 99YYMMDDSSSSS (99 = prefix, YYMMDD = date, SSSSS = sequence)

CREATE TABLE IF NOT EXISTS sku_sequence (
  id SERIAL PRIMARY KEY,
  current_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Initialize with first sequence value
INSERT INTO sku_sequence (current_value) 
VALUES (0)
ON CONFLICT DO NOTHING;

-- Function to get next SKU sequence (atomic increment)
CREATE OR REPLACE FUNCTION get_next_sku_sequence()
RETURNS INTEGER AS $$
DECLARE
  next_val INTEGER;
BEGIN
  UPDATE sku_sequence 
  SET current_value = current_value + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING current_value INTO next_val;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;
