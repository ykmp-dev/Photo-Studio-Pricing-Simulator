-- Migration 013: Fix form_blocks metadata for Shichigosan form
-- Problem: form_blocks are referencing old product_category_id values that don't exist
-- Solution: Update metadata to reference correct product_category_id by name lookup

-- Update メイク (makeup) category reference blocks
UPDATE form_blocks
SET metadata = jsonb_set(
  metadata,
  '{product_category_id}',
  to_jsonb((SELECT id FROM product_categories WHERE name = 'makeup' LIMIT 1))
)
WHERE block_type = 'category_reference'
  AND content LIKE '%メイク%'
  AND form_schema_id IN (
    SELECT id FROM form_schemas WHERE name LIKE '%七五三%'
  );

-- Update ヘアセット (hair) category reference blocks
UPDATE form_blocks
SET metadata = jsonb_set(
  metadata,
  '{product_category_id}',
  to_jsonb((SELECT id FROM product_categories WHERE name = 'hair' LIMIT 1))
)
WHERE block_type = 'category_reference'
  AND content LIKE '%ヘアセット%'
  AND form_schema_id IN (
    SELECT id FROM form_schemas WHERE name LIKE '%七五三%'
  );

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
WHERE fb.form_schema_id IN (
  SELECT id FROM form_schemas WHERE name LIKE '%七五三%'
)
ORDER BY fb.sort_order;
