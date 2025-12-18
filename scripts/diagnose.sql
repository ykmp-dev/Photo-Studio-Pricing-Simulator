-- ============================================================
-- 診断スクリプト：フォームビルダーの問題を特定
-- ============================================================
-- Supabaseダッシュボード → SQL Editor で実行してください
-- ============================================================

-- 1. 必要なテーブルの存在確認
-- ============================================================
SELECT
  'form_schemas' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_schemas'
  ) as exists
UNION ALL
SELECT
  'form_blocks' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'form_blocks'
  ) as exists
UNION ALL
SELECT
  'published_blocks' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'published_blocks'
  ) as exists;

-- 期待結果: すべて true
-- published_blocks が false の場合: マイグレーション015を適用してください

-- ============================================================
-- 2. 必要な関数の存在確認
-- ============================================================
SELECT
  'save_form_blocks' as function_name,
  EXISTS (
    SELECT FROM pg_proc WHERE proname = 'save_form_blocks'
  ) as exists;

-- 期待結果: true
-- false の場合: マイグレーション016を適用してください

-- ============================================================
-- 3. form_schemas のステータス列確認
-- ============================================================
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'form_schemas'
  AND column_name IN ('status', 'published_at');

-- 期待結果:
-- status | character varying | 'draft'
-- published_at | timestamp with time zone | NULL

-- ============================================================
-- 4. 現在のフォームデータの状態
-- ============================================================
SELECT
  fs.id,
  fs.name,
  fs.status,
  fs.updated_at as last_saved,
  fs.published_at as last_published,
  COALESCE(fb_count.count, 0) as draft_blocks,
  COALESCE(pb_count.count, 0) as published_blocks
FROM form_schemas fs
LEFT JOIN (
  SELECT form_schema_id, count(*) as count
  FROM form_blocks
  GROUP BY form_schema_id
) fb_count ON fb_count.form_schema_id = fs.id
LEFT JOIN (
  SELECT form_schema_id, count(*) as count
  FROM published_blocks
  GROUP BY form_schema_id
) pb_count ON pb_count.form_schema_id = fs.id
ORDER BY fs.id;

-- 期待結果:
-- - draft_blocks: 管理者が編集中のブロック数
-- - published_blocks: お客様に表示されるブロック数
-- - published_blocks が 0 の場合: 「更新」ボタンをまだ押していない

-- ============================================================
-- 5. published_blocks のサンプルデータ
-- ============================================================
SELECT
  pb.id,
  pb.form_schema_id,
  pb.block_type,
  LEFT(pb.content, 50) as content_preview,
  pb.sort_order,
  pb.published_at
FROM published_blocks pb
ORDER BY pb.form_schema_id, pb.sort_order
LIMIT 10;

-- 期待結果: お客様ページに表示されるブロックのデータ
-- 0 rows の場合: まだ「更新」を実行していない

-- ============================================================
-- 6. RLSポリシーの確認
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('form_blocks', 'published_blocks')
ORDER BY tablename, policyname;

-- 期待結果:
-- published_blocks に対して:
-- - SELECT は誰でもOK (anyone can view)
-- - INSERT/UPDATE/DELETE は認証済みユーザーのみ

-- ============================================================
-- 診断結果の解釈
-- ============================================================
--
-- ■ ブロック追加ができない場合
--
-- 原因1: JavaScriptエラー
--   → ブラウザコンソールを確認
--
-- 原因2: form が null
--   → フォームが正しくロードされているか確認
--
-- ■ 保存ができない場合
--
-- 原因1: save_form_blocks 関数が存在しない
--   → 上記「2. 必要な関数の存在確認」で false
--   → 対処: マイグレーション016を適用
--
-- 原因2: form_blocks へのアクセス権限がない
--   → 上記「6. RLSポリシーの確認」を確認
--
-- ■ 更新してもお客様ページに反映されない場合
--
-- 原因1: published_blocks テーブルが存在しない
--   → 上記「1. 必要なテーブルの存在確認」で false
--   → 対処: マイグレーション015を適用
--
-- 原因2: published_blocks にデータがない
--   → 上記「4. 現在のフォームデータの状態」で published_blocks = 0
--   → 対処: 「更新」ボタンを押してください
--
-- 原因3: お客様ページが form_blocks を見ている
--   → getFormByShootingCategory の実装を確認
--   → 正しくは published_blocks を参照すべき
--
-- ============================================================
