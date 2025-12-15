-- Migration 013: Fix form_blocks metadata for Shichigosan form
-- Problem: form_blocks are referencing old product_category_id values that don't exist
-- Solution: Update metadata to reference correct product_category_id
--   - makeup (メイク) = id: 2
--   - hair (ヘアセット) = id: 1

-- Update メイク (makeup) category reference blocks
UPDATE form_blocks
SET metadata = jsonb_set(
  metadata,
  '{product_category_id}',
  to_jsonb(2)
)
WHERE block_type = 'category_reference'
  AND content LIKE '%メイク%';

-- Update ヘアセット (hair) category reference blocks
UPDATE form_blocks
SET metadata = jsonb_set(
  metadata,
  '{product_category_id}',
  to_jsonb(1)
)
WHERE block_type = 'category_reference'
  AND content LIKE '%ヘアセット%';

-- Verify the updates
SELECT
  fb.id,
  fb.block_type,
  fb.content,
  fb.metadata,
  pc.id as product_category_id,
  pc.name as product_category_name,
  pc.display_name as product_category_display_name
FROM form_blocks fb
LEFT JOIN product_categories pc ON pc.id = (fb.metadata->>'product_category_id')::int
WHERE fb.block_type = 'category_reference'
ORDER BY fb.sort_order;
