-- RLSポリシー設定と既存テーブルの修正
-- このマイグレーションを実行することで、認証ユーザーがデータを操作できるようになります

-- ========== RLSポリシー設定 ==========

-- shops テーブル
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shops_select_policy" ON shops
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "shops_insert_policy" ON shops
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "shops_update_policy" ON shops
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "shops_delete_policy" ON shops
  FOR DELETE TO authenticated
  USING (true);

-- plans テーブル
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_policy" ON plans
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "plans_insert_policy" ON plans
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "plans_update_policy" ON plans
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "plans_delete_policy" ON plans
  FOR DELETE TO authenticated
  USING (true);

-- options テーブル
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "options_select_policy" ON options
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "options_insert_policy" ON options
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "options_update_policy" ON options
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "options_delete_policy" ON options
  FOR DELETE TO authenticated
  USING (true);

-- campaigns テーブル
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_policy" ON campaigns
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "campaigns_insert_policy" ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "campaigns_update_policy" ON campaigns
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "campaigns_delete_policy" ON campaigns
  FOR DELETE TO authenticated
  USING (true);

-- campaign_plan_associations テーブル
ALTER TABLE campaign_plan_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_plan_associations_select_policy" ON campaign_plan_associations
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "campaign_plan_associations_insert_policy" ON campaign_plan_associations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "campaign_plan_associations_update_policy" ON campaign_plan_associations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "campaign_plan_associations_delete_policy" ON campaign_plan_associations
  FOR DELETE TO authenticated
  USING (true);

-- ========== カテゴリ管理テーブル ==========

-- プランカテゴリテーブル
CREATE TABLE IF NOT EXISTS plan_categories (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, name)
);

-- オプションカテゴリテーブル
CREATE TABLE IF NOT EXISTS option_categories (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, name)
);

-- カテゴリテーブルのRLS設定
ALTER TABLE plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_categories_select_policy" ON plan_categories
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "plan_categories_insert_policy" ON plan_categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "plan_categories_update_policy" ON plan_categories
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "plan_categories_delete_policy" ON plan_categories
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "option_categories_select_policy" ON option_categories
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "option_categories_insert_policy" ON option_categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "option_categories_update_policy" ON option_categories
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "option_categories_delete_policy" ON option_categories
  FOR DELETE TO authenticated
  USING (true);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_plan_categories_shop_id ON plan_categories(shop_id);
CREATE INDEX IF NOT EXISTS idx_option_categories_shop_id ON option_categories(shop_id);

-- updated_at自動更新トリガー
CREATE TRIGGER update_plan_categories_updated_at BEFORE UPDATE ON plan_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_categories_updated_at BEFORE UPDATE ON option_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== 初期カテゴリデータ挿入 ==========

-- shop_id = 1 のデフォルトカテゴリを挿入（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM shops WHERE id = 1) THEN
    -- プランカテゴリ
    INSERT INTO plan_categories (shop_id, name, display_name, sort_order) VALUES
      (1, 'shichigosan', '七五三', 0),
      (1, 'seijinshiki', '成人式', 1),
      (1, 'omiyamairi', 'お宮参り', 2),
      (1, 'family', '家族写真', 3)
    ON CONFLICT (shop_id, name) DO NOTHING;

    -- オプションカテゴリ
    INSERT INTO option_categories (shop_id, name, display_name, sort_order) VALUES
      (1, 'hair', 'ヘアセット', 0),
      (1, 'makeup', 'メイク', 1),
      (1, 'dressing', '着付け', 2),
      (1, 'photo_item', '撮影アイテム', 3)
    ON CONFLICT (shop_id, name) DO NOTHING;
  END IF;
END $$;
