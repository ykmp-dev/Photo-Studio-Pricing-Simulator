-- アイテムテーブルの作成（is_required, auto_selectを含む）
-- Migration 006が未実行の環境向け

-- ========== アイテム（実際の商品）==========
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL, -- 税込価格（円）
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false, -- 必須アイテム（選択解除不可）
  auto_select BOOLEAN DEFAULT false, -- 商品カテゴリ選択時に自動選択
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== RLSポリシー設定 ==========
DO $$
BEGIN
  -- RLS有効化
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'items'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE items ENABLE ROW LEVEL SECURITY;
  END IF;

  -- ポリシー作成（存在しない場合のみ）
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'items_select_policy') THEN
    CREATE POLICY "items_select_policy" ON items FOR SELECT TO authenticated, anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'items_insert_policy') THEN
    CREATE POLICY "items_insert_policy" ON items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'items_update_policy') THEN
    CREATE POLICY "items_update_policy" ON items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'items_delete_policy') THEN
    CREATE POLICY "items_delete_policy" ON items FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ========== インデックス作成 ==========
CREATE INDEX IF NOT EXISTS idx_items_shop_id ON items(shop_id);
CREATE INDEX IF NOT EXISTS idx_items_product_category ON items(product_category_id);
CREATE INDEX IF NOT EXISTS idx_items_auto_select ON items(product_category_id, auto_select) WHERE auto_select = true;

-- ========== updated_at自動更新トリガー ==========
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_items_updated_at'
  ) THEN
    CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ========== コメント追加 ==========
COMMENT ON COLUMN items.is_required IS '必須アイテム（選択解除不可）';
COMMENT ON COLUMN items.auto_select IS '商品カテゴリ選択時に自動選択';

-- ========== 初期データ挿入 ==========
-- アイテムのサンプルデータ（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM shops WHERE id = 1) THEN
    -- ヘアセットカテゴリ
    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, '基本ヘアセット', 5000, 0
    FROM product_categories pc WHERE pc.name = 'hair' AND pc.shop_id = 1
    ON CONFLICT DO NOTHING;

    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, '日本髪ヘアセット', 8000, 1
    FROM product_categories pc WHERE pc.name = 'hair' AND pc.shop_id = 1
    ON CONFLICT DO NOTHING;

    -- メイクカテゴリ
    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, 'ナチュラルメイク', 3000, 0
    FROM product_categories pc WHERE pc.name = 'makeup' AND pc.shop_id = 1
    ON CONFLICT DO NOTHING;

    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, 'フルメイク', 5000, 1
    FROM product_categories pc WHERE pc.name = 'makeup' AND pc.shop_id = 1
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ========== 既存のitemsテーブルにカラム追加（テーブルが既に存在する場合）==========
DO $$
BEGIN
  -- is_requiredカラムが存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name = 'is_required'
  ) THEN
    ALTER TABLE items ADD COLUMN is_required BOOLEAN DEFAULT false;
    COMMENT ON COLUMN items.is_required IS '必須アイテム（選択解除不可）';
  END IF;

  -- auto_selectカラムが存在しない場合のみ追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name = 'auto_select'
  ) THEN
    ALTER TABLE items ADD COLUMN auto_select BOOLEAN DEFAULT false;
    COMMENT ON COLUMN items.auto_select IS '商品カテゴリ選択時に自動選択';
  END IF;
END $$;
