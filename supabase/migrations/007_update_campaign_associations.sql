-- キャンペーンシステムを新カテゴリ構造に対応
-- 撮影カテゴリ、商品カテゴリ、アイテムごとに割引を適用可能

-- ========== 旧システムのクリーンアップ ==========

-- 旧campaign_plan_associationsテーブルを削除（plansテーブル依存）
DROP TABLE IF EXISTS campaign_plan_associations CASCADE;

-- ========== 新しいキャンペーン関連テーブル ==========

-- キャンペーン×撮影カテゴリ の関連
CREATE TABLE IF NOT EXISTS campaign_shooting_associations (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  shooting_category_id INT NOT NULL REFERENCES shooting_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, shooting_category_id)
);

-- キャンペーン×商品カテゴリ の関連
CREATE TABLE IF NOT EXISTS campaign_product_associations (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, product_category_id)
);

-- キャンペーン×アイテム の関連
CREATE TABLE IF NOT EXISTS campaign_item_associations (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, item_id)
);

-- ========== RLSポリシー設定 ==========

ALTER TABLE campaign_shooting_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_product_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_item_associations ENABLE ROW LEVEL SECURITY;

-- campaign_shooting_associations
CREATE POLICY "campaign_shooting_associations_select_policy" ON campaign_shooting_associations
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "campaign_shooting_associations_insert_policy" ON campaign_shooting_associations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "campaign_shooting_associations_update_policy" ON campaign_shooting_associations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "campaign_shooting_associations_delete_policy" ON campaign_shooting_associations
  FOR DELETE TO authenticated USING (true);

-- campaign_product_associations
CREATE POLICY "campaign_product_associations_select_policy" ON campaign_product_associations
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "campaign_product_associations_insert_policy" ON campaign_product_associations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "campaign_product_associations_update_policy" ON campaign_product_associations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "campaign_product_associations_delete_policy" ON campaign_product_associations
  FOR DELETE TO authenticated USING (true);

-- campaign_item_associations
CREATE POLICY "campaign_item_associations_select_policy" ON campaign_item_associations
  FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "campaign_item_associations_insert_policy" ON campaign_item_associations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "campaign_item_associations_update_policy" ON campaign_item_associations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "campaign_item_associations_delete_policy" ON campaign_item_associations
  FOR DELETE TO authenticated USING (true);

-- ========== インデックス作成 ==========

CREATE INDEX IF NOT EXISTS idx_campaign_shooting_associations_campaign ON campaign_shooting_associations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_shooting_associations_shooting ON campaign_shooting_associations(shooting_category_id);

CREATE INDEX IF NOT EXISTS idx_campaign_product_associations_campaign ON campaign_product_associations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_product_associations_product ON campaign_product_associations(product_category_id);

CREATE INDEX IF NOT EXISTS idx_campaign_item_associations_campaign ON campaign_item_associations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_item_associations_item ON campaign_item_associations(item_id);

-- ========== 使用例コメント ==========

-- キャンペーン例: 「七五三早割キャンペーン」
-- 対象:
--   - 撮影カテゴリ: 七五三
--   - 商品カテゴリ: ヘアセット、メイク
--   - アイテム: 基本ヘアセット、ナチュラルメイク
--
-- 適用ロジック:
--   七五三を選択 AND (基本ヘアセット OR ナチュラルメイク) を選択した場合に割引適用
