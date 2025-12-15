-- Migration: Add conditional blocks support (Yes/No blocks and show_condition)
-- Description: Add yes_no block type and show_condition field for conditional display

-- Note: block_type is VARCHAR(50), not an ENUM, so we don't need to alter a type
-- The 'yes_no' value can be used directly as a string

-- 1. Add show_condition column to form_blocks
-- This will store JSON like: {"type": "yes_no", "block_id": 123, "value": "yes"}
ALTER TABLE form_blocks
ADD COLUMN IF NOT EXISTS show_condition JSONB DEFAULT NULL;

-- 2. Add comment for documentation
COMMENT ON COLUMN form_blocks.show_condition IS 'Condition for displaying this block. Format: {"type": "yes_no", "block_id": number, "value": "yes"|"no"}';
COMMENT ON COLUMN form_blocks.block_type IS 'ブロックタイプ: text(テキスト), heading(見出し), list(リスト), category_reference(カテゴリ参照), yes_no(Yes/No質問)';

-- 3. Create index for better query performance on show_condition
CREATE INDEX IF NOT EXISTS idx_form_blocks_show_condition
ON form_blocks USING gin (show_condition);
