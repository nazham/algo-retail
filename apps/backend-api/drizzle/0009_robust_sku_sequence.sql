-- Migration: Robust SKU Sequence
-- Purpose: Handle case where sku_sequence table is truncated by using UPSERT (INSERT ON CONFLICT)

CREATE OR REPLACE FUNCTION get_next_sku_sequence()
RETURNS INTEGER AS $$
DECLARE
  next_val INTEGER;
BEGIN
  -- Try to insert initial value of 1, if id=1 exists, increment it
  INSERT INTO sku_sequence (id, current_value) 
  VALUES (1, 1)
  ON CONFLICT (id) 
  DO UPDATE SET 
    current_value = sku_sequence.current_value + 1,
    updated_at = NOW()
  RETURNING current_value INTO next_val;
  
  RETURN next_val;
END;
$$ LANGUAGE plpgsql;
