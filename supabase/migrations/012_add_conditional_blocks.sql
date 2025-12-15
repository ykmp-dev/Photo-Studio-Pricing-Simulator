-- Migration: Add conditional blocks support (Yes/No blocks and show_condition)
-- Description: Add yes_no block type and show_condition field for conditional display

-- 1. Add yes_no to block_type enum
DO $$ BEGIN
  ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'yes_no';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add show_condition column to form_blocks
-- This will store JSON like: {"type": "yes_no", "block_id": 123, "value": "yes"}
ALTER TABLE form_blocks
ADD COLUMN IF NOT EXISTS show_condition JSONB DEFAULT NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN form_blocks.show_condition IS 'Condition for displaying this block. Format: {"type": "yes_no", "block_id": number, "value": "yes"|"no"}';

-- 4. Create index for better query performance on show_condition
CREATE INDEX IF NOT EXISTS idx_form_blocks_show_condition
ON form_blocks USING gin (show_condition);
