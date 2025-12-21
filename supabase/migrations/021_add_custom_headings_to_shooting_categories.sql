-- 撮影カテゴリにカスタム見出しフィールドを追加
-- フォームの各セクション見出しをカスタマイズ可能にする

ALTER TABLE shooting_categories
ADD COLUMN IF NOT EXISTS heading_trigger TEXT DEFAULT '基本情報',
ADD COLUMN IF NOT EXISTS heading_conditional TEXT DEFAULT 'オプション',
ADD COLUMN IF NOT EXISTS heading_common_final TEXT DEFAULT '追加オプション';

COMMENT ON COLUMN shooting_categories.heading_trigger IS 'Triggerセクションの見出し';
COMMENT ON COLUMN shooting_categories.heading_conditional IS 'Conditionalセクションの見出し';
COMMENT ON COLUMN shooting_categories.heading_common_final IS 'Common Finalセクションの見出し';
