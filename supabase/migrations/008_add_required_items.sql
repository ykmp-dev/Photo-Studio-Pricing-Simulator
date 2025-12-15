-- 必須アイテム機能追加
-- プラン料金などを自動選択・必須にするための機能

-- ========== itemsテーブルにカラム追加 ==========

ALTER TABLE items
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_select BOOLEAN DEFAULT false;

-- インデックス追加（auto_selectでの検索用）
CREATE INDEX IF NOT EXISTS idx_items_auto_select ON items(product_category_id, auto_select) WHERE auto_select = true;

-- コメント追加
COMMENT ON COLUMN items.is_required IS '必須アイテム（選択解除不可）';
COMMENT ON COLUMN items.auto_select IS '商品カテゴリ選択時に自動選択';

-- ========== 使用例 ==========

-- 例1: 3歳スタジオ撮影プラン
-- product_categories にプランを作成
-- INSERT INTO product_categories (shop_id, name, display_name) VALUES (1, '3age-studio-plan', '3歳スタジオ撮影プラン');

-- items にプラン料金を追加（is_required=true, auto_select=true）
-- INSERT INTO items (shop_id, product_category_id, name, price, is_required, auto_select)
-- VALUES (1, [product_category_id], 'プラン料金', 44000, true, true);

-- items にオプションを追加（is_required=false, auto_select=false）
-- INSERT INTO items (shop_id, product_category_id, name, price)
-- VALUES (1, [product_category_id], 'ヘアセット', 5000, false, false);

-- ========== 既存データの確認 ==========

-- 既存のitemsデータを確認
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM items LIMIT 1) THEN
    RAISE NOTICE '既存のitemsデータが存在します。必要に応じてis_required, auto_selectを更新してください。';
  END IF;
END $$;
