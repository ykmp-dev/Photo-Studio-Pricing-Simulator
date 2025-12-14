-- ========================================
-- データベース状態確認スクリプト
-- Supabase Studio の SQL Editor で実行してください
-- ========================================

-- 1. 存在するテーブル一覧
SELECT '========== 存在するテーブル一覧 ==========' as info;
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. itemsテーブルの存在確認
SELECT '========== itemsテーブルの存在確認 ==========' as info;
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'items'
) as items_table_exists;

-- 3. itemsテーブルのカラム構造（存在する場合）
SELECT '========== itemsテーブルのカラム構造 ==========' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'items'
ORDER BY ordinal_position;

-- 4. itemsテーブルのデータ件数と最初の3件
SELECT '========== itemsテーブルのデータ ==========' as info;
SELECT COUNT(*) as total_items FROM items;
SELECT * FROM items LIMIT 3;

-- 5. 主要テーブルのデータ件数
SELECT '========== 主要テーブルのデータ件数 ==========' as info;
SELECT
  'shops' as table_name,
  COUNT(*) as count
FROM shops
UNION ALL
SELECT
  'campaigns' as table_name,
  COUNT(*) as count
FROM campaigns
UNION ALL
SELECT
  'shooting_categories' as table_name,
  COUNT(*) as count
FROM shooting_categories
UNION ALL
SELECT
  'product_categories' as table_name,
  COUNT(*) as count
FROM product_categories
UNION ALL
SELECT
  'items' as table_name,
  COUNT(*) as count
FROM items
UNION ALL
SELECT
  'shooting_product_associations' as table_name,
  COUNT(*) as count
FROM shooting_product_associations;

-- 6. is_required, auto_select カラムの存在確認
SELECT '========== 必須アイテム機能のカラム確認 ==========' as info;
SELECT
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name = 'is_required'
  ) as is_required_exists,
  EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name = 'auto_select'
  ) as auto_select_exists;

-- 7. itemsテーブルのインデックス一覧
SELECT '========== itemsテーブルのインデックス ==========' as info;
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'items';

-- 8. itemsテーブルのRLSポリシー
SELECT '========== itemsテーブルのRLSポリシー ==========' as info;
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'items';

-- 9. 実行可能なアクション判定
SELECT '========== 推奨アクション ==========' as info;
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'items'
    ) THEN
      '❌ itemsテーブルが存在しません → Migration 009 を実行してください'
    WHEN NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'items'
      AND column_name = 'is_required'
    ) THEN
      '⚠️ itemsテーブルは存在しますが、is_requiredカラムがありません → Migration 009 を実行してください'
    ELSE
      '✅ itemsテーブルとis_required/auto_selectカラムが存在します。必須アイテム機能が使用可能です！'
  END as recommendation;
