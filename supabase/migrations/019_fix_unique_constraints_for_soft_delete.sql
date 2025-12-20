-- 019: 論理削除対応のユニーク制約に変更
-- 問題: is_activeを使った論理削除で、同じnameのレコードを再作成できない
-- 解決: 部分ユニーク制約 (WHERE is_active = true) を使用

-- ========== shooting_categories ==========
-- 既存の制約を削除
ALTER TABLE shooting_categories
  DROP CONSTRAINT IF EXISTS shooting_categories_shop_id_name_key;

-- 部分ユニーク制約を追加（is_active = true の場合のみ）
CREATE UNIQUE INDEX IF NOT EXISTS shooting_categories_shop_id_name_active_idx
  ON shooting_categories(shop_id, name)
  WHERE is_active = true;

-- ========== product_categories ==========
-- 既存の制約を削除
ALTER TABLE product_categories
  DROP CONSTRAINT IF EXISTS product_categories_shop_id_name_key;

-- 部分ユニーク制約を追加（is_active = true の場合のみ）
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_shop_id_name_active_idx
  ON product_categories(shop_id, name)
  WHERE is_active = true;

-- ========== 確認クエリ（実行後に確認用） ==========
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('shooting_categories', 'product_categories')
--   AND indexname LIKE '%active%';
