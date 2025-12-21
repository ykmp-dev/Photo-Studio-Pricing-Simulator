-- 撮影カテゴリに画像URLカラムを追加
-- 画像カードUIで使用するためのサムネイル画像

ALTER TABLE shooting_categories
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN shooting_categories.image_url IS '撮影カテゴリのサムネイル画像URL';
