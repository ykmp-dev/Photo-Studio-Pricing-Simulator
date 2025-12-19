-- Migration 017: Add v3 form builder fields to product_categories
-- Description: v3仕様書に基づき、product_categoriesテーブルに必要なカラムを追加

-- 1. form_section カラムを追加
-- "trigger", "conditional", "common_final" のいずれか、またはNULL
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS form_section VARCHAR(50) CHECK (
  form_section IS NULL OR
  form_section IN ('trigger', 'conditional', 'common_final')
);

-- 2. product_type カラムを追加
-- "plan", "option_single", "option_multi" のいずれか、またはNULL
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) CHECK (
  product_type IS NULL OR
  product_type IN ('plan', 'option_single', 'option_multi')
);

-- 3. conditional_rule カラムを追加
-- AND/OR対応のJSON条件ルール
ALTER TABLE product_categories
ADD COLUMN IF NOT EXISTS conditional_rule JSONB DEFAULT NULL;

-- 4. インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_product_categories_form_section
  ON product_categories(form_section) WHERE form_section IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_categories_product_type
  ON product_categories(product_type) WHERE product_type IS NOT NULL;

-- GINインデックス（JSONB検索の高速化）
CREATE INDEX IF NOT EXISTS idx_product_categories_conditional_rule
  ON product_categories USING GIN (conditional_rule) WHERE conditional_rule IS NOT NULL;

-- 5. コメント追加（ドキュメント）
COMMENT ON COLUMN product_categories.form_section IS 'v3フォームビルダー: セクションタイプ (trigger, conditional, common_final)';
COMMENT ON COLUMN product_categories.product_type IS 'v3フォームビルダー: 商品タイプ (plan, option_single, option_multi)';
COMMENT ON COLUMN product_categories.conditional_rule IS 'v3フォームビルダー: 条件ルール（JSONB）。例: {"AND": [{"field": "plan_type", "operator": "=", "value": "studio"}]}';

-- 6. サンプルデータ（開発・テスト用）
-- 七五三のサンプルカテゴリを作成
DO $$
DECLARE
  v_shop_id INT := 1;
  v_shooting_category_id INT;
  v_plan_category_id INT;
  v_option_category_id INT;
  v_kimono_category_id INT;
  v_album_category_id INT;
BEGIN
  -- 店舗と撮影カテゴリが存在する場合のみ
  IF EXISTS (SELECT 1 FROM shops WHERE id = v_shop_id) THEN
    -- 七五三カテゴリのIDを取得
    SELECT id INTO v_shooting_category_id
    FROM shooting_categories
    WHERE shop_id = v_shop_id AND name = 'shichigosan'
    LIMIT 1;

    IF v_shooting_category_id IS NOT NULL THEN
      -- 1. 撮影コースカテゴリ (Trigger)
      INSERT INTO product_categories (
        shop_id, name, display_name, description,
        form_section, product_type, sort_order
      ) VALUES (
        v_shop_id, 'plan', '撮影コース', '撮影プランをお選びください',
        'trigger', 'plan', 0
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_plan_category_id;

      -- 2. 基本オプションカテゴリ (Trigger)
      INSERT INTO product_categories (
        shop_id, name, display_name, description,
        form_section, product_type, sort_order
      ) VALUES (
        v_shop_id, 'basic_option', '基本オプション', '撮影日をお選びください',
        'trigger', 'option_single', 1
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_option_category_id;

      -- 3. 着物グレードカテゴリ (Conditional)
      -- 条件: plan_type = 'studio' AND basic_option = 'weekday'
      INSERT INTO product_categories (
        shop_id, name, display_name, description,
        form_section, product_type, conditional_rule, sort_order
      ) VALUES (
        v_shop_id, 'kimono', '着物のグレード', '着物をお選びください',
        'conditional', 'option_single',
        '{"AND": [
          {"field": "plan_type", "operator": "=", "value": "studio"},
          {"field": "basic_option", "operator": "=", "value": "weekday"}
        ]}'::jsonb,
        2
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_kimono_category_id;

      -- 4. アルバムカテゴリ (Common Final)
      INSERT INTO product_categories (
        shop_id, name, display_name, description,
        form_section, product_type, sort_order
      ) VALUES (
        v_shop_id, 'album', 'アルバム・フォトブック', 'アルバムをお選びください',
        'common_final', 'option_multi', 3
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO v_album_category_id;

      -- 撮影カテゴリとの関連付け
      IF v_plan_category_id IS NOT NULL THEN
        INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
        VALUES (v_shooting_category_id, v_plan_category_id, 0)
        ON CONFLICT DO NOTHING;
      END IF;

      IF v_option_category_id IS NOT NULL THEN
        INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
        VALUES (v_shooting_category_id, v_option_category_id, 1)
        ON CONFLICT DO NOTHING;
      END IF;

      IF v_kimono_category_id IS NOT NULL THEN
        INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
        VALUES (v_shooting_category_id, v_kimono_category_id, 2)
        ON CONFLICT DO NOTHING;
      END IF;

      IF v_album_category_id IS NOT NULL THEN
        INSERT INTO shooting_product_associations (shooting_category_id, product_category_id, sort_order)
        VALUES (v_shooting_category_id, v_album_category_id, 3)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
END $$;
