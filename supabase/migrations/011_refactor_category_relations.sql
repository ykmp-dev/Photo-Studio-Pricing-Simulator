-- Migration 011: マスターデータ独立化と関連テーブル拡張
-- 撮影カテゴリと商品カテゴリを多対多関係に変更

-- 1. shooting_product_associations テーブルに is_required カラムを追加（存在しない場合）
DO $$
BEGIN
  -- テーブルが存在しない場合は作成
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'shooting_product_associations') THEN
    CREATE TABLE shooting_product_associations (
      id SERIAL PRIMARY KEY,
      shooting_category_id INT NOT NULL REFERENCES shooting_categories(id) ON DELETE CASCADE,
      product_category_id INT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
      sort_order INT DEFAULT 0,
      is_required BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(shooting_category_id, product_category_id)
    );
  ELSE
    -- テーブルが存在する場合は is_required カラムを追加
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'shooting_product_associations'
      AND column_name = 'is_required'
    ) THEN
      ALTER TABLE shooting_product_associations ADD COLUMN is_required BOOLEAN DEFAULT FALSE;
    END IF;

    -- updated_at カラムがない場合は追加
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'shooting_product_associations'
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE shooting_product_associations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- 2. 既存のproduct_categoriesのshooting_category_idデータを関連テーブルに移行
DO $$
BEGIN
  -- shooting_category_idが設定されている商品カテゴリを関連テーブルに移行
  INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order, is_required)
  SELECT
    shooting_category_id,
    id as product_category_id,
    ROW_NUMBER() OVER (PARTITION BY shooting_category_id ORDER BY id) - 1 as sort_order,
    FALSE as is_required
  FROM product_categories
  WHERE shooting_category_id IS NOT NULL
  ON CONFLICT (shooting_category_id, product_category_id) DO NOTHING;
END $$;

-- 3. product_categoriesのshooting_category_idカラムを削除
-- 注意: 既存のform_schemasテーブルはそのまま保持（別の目的で使用中）
ALTER TABLE product_categories DROP COLUMN IF EXISTS shooting_category_id;

-- 4. インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_shooting_product_associations_shooting
  ON shooting_product_associations(shooting_category_id);
CREATE INDEX IF NOT EXISTS idx_shooting_product_associations_product
  ON shooting_product_associations(product_category_id);
CREATE INDEX IF NOT EXISTS idx_shooting_product_associations_sort
  ON shooting_product_associations(shooting_category_id, sort_order);

-- 5. 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_shooting_product_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_shooting_product_associations_updated_at ON shooting_product_associations;
CREATE TRIGGER trigger_update_shooting_product_associations_updated_at
  BEFORE UPDATE ON shooting_product_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_shooting_product_associations_updated_at();

-- 6. コメント追加（ドキュメント）
COMMENT ON TABLE shooting_product_associations IS '撮影カテゴリと商品カテゴリの多対多関連テーブル';
COMMENT ON COLUMN shooting_product_associations.sort_order IS '商品カテゴリの表示順序';
COMMENT ON COLUMN shooting_product_associations.is_required IS '必須選択フラグ（将来の拡張用）';
