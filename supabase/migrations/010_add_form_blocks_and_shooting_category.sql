-- フォームビルダー：撮影カテゴリ連携とブロック機能追加
-- 撮影カテゴリごとに1つのフォームを作成できるようにする

-- ========== form_schemasに撮影カテゴリIDを追加 ==========
ALTER TABLE form_schemas
ADD COLUMN IF NOT EXISTS shooting_category_id INT REFERENCES shooting_categories(id) ON DELETE CASCADE;

-- ユニーク制約: 1撮影カテゴリに1フォーム
-- 部分インデックス: shooting_category_idがNULLでない場合のみ適用
CREATE UNIQUE INDEX IF NOT EXISTS idx_form_schemas_shooting_category
ON form_schemas(shop_id, shooting_category_id)
WHERE shooting_category_id IS NOT NULL;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_form_schemas_shooting_category_id ON form_schemas(shooting_category_id);

COMMENT ON COLUMN form_schemas.shooting_category_id IS '撮影カテゴリID（NULL可: 汎用フォーム）';

-- ========== フォームブロックテーブル作成 ==========
-- テキスト、見出し、リスト、カテゴリ参照などの表示要素
CREATE TABLE IF NOT EXISTS form_blocks (
  id SERIAL PRIMARY KEY,
  form_schema_id INT NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL, -- 'text', 'heading', 'list', 'category_reference'
  content TEXT, -- テキスト、見出し、リストの内容
  sort_order INT DEFAULT 0,

  -- カテゴリ参照ブロック用のメタデータ
  -- { product_category_id: number, display_mode: 'expanded' | 'collapsed' }
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== RLSポリシー設定 ==========
ALTER TABLE form_blocks ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから作成
DROP POLICY IF EXISTS "Anyone can view form blocks" ON form_blocks;
DROP POLICY IF EXISTS "Authenticated users can insert form blocks" ON form_blocks;
DROP POLICY IF EXISTS "Authenticated users can update form blocks" ON form_blocks;
DROP POLICY IF EXISTS "Authenticated users can delete form blocks" ON form_blocks;

-- 読み取りは誰でもOK
CREATE POLICY "Anyone can view form blocks"
ON form_blocks FOR SELECT USING (true);

-- 書き込みは認証済みユーザーのみ
CREATE POLICY "Authenticated users can insert form blocks"
ON form_blocks FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update form blocks"
ON form_blocks FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete form blocks"
ON form_blocks FOR DELETE
USING (auth.role() = 'authenticated');

-- ========== インデックス作成 ==========
CREATE INDEX IF NOT EXISTS idx_form_blocks_form_schema_id ON form_blocks(form_schema_id);
CREATE INDEX IF NOT EXISTS idx_form_blocks_sort_order ON form_blocks(form_schema_id, sort_order);

-- ========== コメント追加 ==========
COMMENT ON TABLE form_blocks IS 'フォーム内の表示ブロック（テキスト、見出し、リスト、カテゴリ参照）';
COMMENT ON COLUMN form_blocks.block_type IS 'ブロックタイプ: text(テキスト), heading(見出し), list(リスト), category_reference(カテゴリ参照)';
COMMENT ON COLUMN form_blocks.content IS 'テキスト、見出し、リストの内容（Markdown対応予定）';
COMMENT ON COLUMN form_blocks.metadata IS 'カテゴリ参照ブロック用メタデータ: { product_category_id, display_mode }';

-- ========== updated_at自動更新トリガー ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_form_blocks_updated_at') THEN
      CREATE TRIGGER update_form_blocks_updated_at BEFORE UPDATE ON form_blocks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END $$;

-- ========== サンプルデータ（開発用） ==========
-- 七五三用のサンプルフォーム
DO $$
DECLARE
  v_shop_id INT := 1;
  v_shooting_category_id INT;
  v_form_schema_id INT;
  v_hair_category_id INT;
  v_makeup_category_id INT;
BEGIN
  -- 店舗とカテゴリが存在する場合のみ
  IF EXISTS (SELECT 1 FROM shops WHERE id = v_shop_id) THEN
    -- 七五三カテゴリのIDを取得
    SELECT id INTO v_shooting_category_id
    FROM shooting_categories
    WHERE shop_id = v_shop_id AND name = 'shichigosan'
    LIMIT 1;

    IF v_shooting_category_id IS NOT NULL THEN
      -- 既存のフォームをチェック
      SELECT id INTO v_form_schema_id
      FROM form_schemas
      WHERE shop_id = v_shop_id AND shooting_category_id = v_shooting_category_id
      LIMIT 1;

      -- フォームが存在しない場合のみ作成
      IF v_form_schema_id IS NULL THEN
        INSERT INTO form_schemas (shop_id, shooting_category_id, name, description)
        VALUES (
          v_shop_id,
          v_shooting_category_id,
          '七五三撮影フォーム',
          '七五三の撮影に必要な情報を入力してください'
        )
        RETURNING id INTO v_form_schema_id;
      END IF;

      -- フォームが作成された場合、ブロックを追加
      IF v_form_schema_id IS NOT NULL THEN
        -- 見出しブロック
        INSERT INTO form_blocks (form_schema_id, block_type, content, sort_order)
        VALUES (v_form_schema_id, 'heading', '## 七五三撮影のご案内', 0);

        -- テキストブロック
        INSERT INTO form_blocks (form_schema_id, block_type, content, sort_order)
        VALUES (v_form_schema_id, 'text', 'お子様の大切な節目をプロのカメラマンが撮影いたします。', 1);

        -- リストブロック
        INSERT INTO form_blocks (form_schema_id, block_type, content, sort_order)
        VALUES (v_form_schema_id, 'list', E'- ヘアセット\n- メイク\n- 着付け\n- アルバム作成', 2);

        -- カテゴリ参照ブロック（ヘアセット）
        SELECT id INTO v_hair_category_id
        FROM product_categories
        WHERE shop_id = v_shop_id AND name = 'hair'
        LIMIT 1;

        IF v_hair_category_id IS NOT NULL THEN
          INSERT INTO form_blocks (form_schema_id, block_type, content, metadata, sort_order)
          VALUES (
            v_form_schema_id,
            'category_reference',
            'ヘアセットをお選びください',
            jsonb_build_object('product_category_id', v_hair_category_id, 'display_mode', 'expanded'),
            3
          );
        END IF;

        -- カテゴリ参照ブロック（メイク）
        SELECT id INTO v_makeup_category_id
        FROM product_categories
        WHERE shop_id = v_shop_id AND name = 'makeup'
        LIMIT 1;

        IF v_makeup_category_id IS NOT NULL THEN
          INSERT INTO form_blocks (form_schema_id, block_type, content, metadata, sort_order)
          VALUES (
            v_form_schema_id,
            'category_reference',
            'メイクをお選びください',
            jsonb_build_object('product_category_id', v_makeup_category_id, 'display_mode', 'expanded'),
            4
          );
        END IF;
      END IF;
    END IF;
  END IF;
END $$;
