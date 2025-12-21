-- 撮影カテゴリから見出しフィールドを削除
-- これらの見出しはform_builder_recordsのmetadataに移行

ALTER TABLE shooting_categories
DROP COLUMN IF EXISTS heading_trigger,
DROP COLUMN IF EXISTS heading_conditional,
DROP COLUMN IF EXISTS heading_common_final;
