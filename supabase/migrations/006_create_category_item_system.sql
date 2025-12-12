-- カテゴリとアイテムの管理システム
-- 撮影カテゴリ → 商品カテゴリ → アイテム の3階層構造

-- ========== 撮影カテゴリ（親カテゴリ）==========
CREATE TABLE IF NOT EXISTS shooting_categories (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, name)
);

-- ========== 商品カテゴリ（子カテゴリ）==========
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, name)
);

-- ========== 撮影カテゴリと商品カテゴリの関連テーブル ==========
CREATE TABLE IF NOT EXISTS shooting_product_associations (
  id SERIAL PRIMARY KEY,
  shooting_category_id INT NOT NULL REFERENCES shooting_categories(id) ON DELETE CASCADE,
  product_category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shooting_category_id, product_category_id)
);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== RLSポリシー設定 ==========

ALTER TABLE shooting_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shooting_product_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- shooting_categories
CREATE POLICY "shooting_categories_select_policy" ON shooting_categories
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "shooting_categories_insert_policy" ON shooting_categories
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shooting_categories_update_policy" ON shooting_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shooting_categories_delete_policy" ON shooting_categories
  FOR DELETE TO authenticated USING (true);

-- product_categories
CREATE POLICY "product_categories_select_policy" ON product_categories
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "product_categories_insert_policy" ON product_categories
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_categories_update_policy" ON product_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "product_categories_delete_policy" ON product_categories
  FOR DELETE TO authenticated USING (true);

-- shooting_product_associations
CREATE POLICY "shooting_product_associations_select_policy" ON shooting_product_associations
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "shooting_product_associations_insert_policy" ON shooting_product_associations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "shooting_product_associations_update_policy" ON shooting_product_associations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "shooting_product_associations_delete_policy" ON shooting_product_associations
  FOR DELETE TO authenticated USING (true);

-- items
CREATE POLICY "items_select_policy" ON items
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "items_insert_policy" ON items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "items_update_policy" ON items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "items_delete_policy" ON items
  FOR DELETE TO authenticated USING (true);

-- ========== インデックス作成 ==========

CREATE INDEX IF NOT EXISTS idx_shooting_categories_shop_id ON shooting_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_shop_id ON product_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_shooting_product_associations_shooting ON shooting_product_associations(shooting_category_id);
CREATE INDEX IF NOT EXISTS idx_shooting_product_associations_product ON shooting_product_associations(product_category_id);
CREATE INDEX IF NOT EXISTS idx_items_shop_id ON items(shop_id);
CREATE INDEX IF NOT EXISTS idx_items_product_category ON items(product_category_id);

-- ========== updated_at自動更新トリガー ==========

CREATE TRIGGER update_shooting_categories_updated_at BEFORE UPDATE ON shooting_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== 初期データ挿入 ==========

-- shop_id = 1 のサンプルデータを挿入（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM shops WHERE id = 1) THEN
    -- 撮影カテゴリ
    INSERT INTO shooting_categories (shop_id, name, display_name, sort_order) VALUES
      (1, 'shichigosan', '七五三', 0),
      (1, 'seijinshiki', '成人式', 1),
      (1, 'omiyamairi', 'お宮参り', 2),
      (1, 'family', '家族写真', 3)
    ON CONFLICT (shop_id, name) DO NOTHING;

    -- 商品カテゴリ
    INSERT INTO product_categories (shop_id, name, display_name, sort_order) VALUES
      (1, 'hair', 'ヘアセット', 0),
      (1, 'makeup', 'メイク', 1),
      (1, 'dressing', '着付け', 2),
      (1, 'photo_items', '撮影アイテム', 3),
      (1, 'album', 'アルバム', 4),
      (1, 'print', 'プリント', 5)
    ON CONFLICT (shop_id, name) DO NOTHING;

    -- 撮影カテゴリと商品カテゴリの関連（例：七五三にはヘアセット、メイク、着付けが表示される）
    INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
    SELECT sc.id, pc.id, 0
    FROM shooting_categories sc
    CROSS JOIN product_categories pc
    WHERE sc.name = 'shichigosan' AND pc.name IN ('hair', 'makeup', 'dressing', 'photo_items', 'album')
    ON CONFLICT (shooting_category_id, product_category_id) DO NOTHING;

    INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
    SELECT sc.id, pc.id, 0
    FROM shooting_categories sc
    CROSS JOIN product_categories pc
    WHERE sc.name = 'seijinshiki' AND pc.name IN ('hair', 'makeup', 'dressing', 'album', 'print')
    ON CONFLICT (shooting_category_id, product_category_id) DO NOTHING;

    -- アイテムのサンプルデータ（ヘアセットカテゴリ）
    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, '基本ヘアセット', 5000, 0
    FROM product_categories pc WHERE pc.name = 'hair'
    ON CONFLICT DO NOTHING;

    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, '日本髪ヘアセット', 8000, 1
    FROM product_categories pc WHERE pc.name = 'hair'
    ON CONFLICT DO NOTHING;

    -- アイテムのサンプルデータ（メイクカテゴリ）
    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, 'ナチュラルメイク', 3000, 0
    FROM product_categories pc WHERE pc.name = 'makeup'
    ON CONFLICT DO NOTHING;

    INSERT INTO items (shop_id, product_category_id, name, price, sort_order)
    SELECT 1, pc.id, 'フルメイク', 5000, 1
    FROM product_categories pc WHERE pc.name = 'makeup'
    ON CONFLICT DO NOTHING;

  END IF;
END $$;
