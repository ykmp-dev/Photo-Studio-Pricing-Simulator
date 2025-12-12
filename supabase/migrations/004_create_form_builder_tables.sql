-- フォームスキーマテーブル
CREATE TABLE form_schemas (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フォームフィールドテーブル
CREATE TABLE form_fields (
  id SERIAL PRIMARY KEY,
  form_schema_id INTEGER NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
  field_type VARCHAR(50) NOT NULL, -- 'select', 'checkbox', 'radio', 'text', 'number'
  label VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  required BOOLEAN DEFAULT false,
  price_value INTEGER DEFAULT 0, -- 価格計算用
  sort_order INTEGER DEFAULT 0,

  -- 条件分岐用メタデータ
  metadata JSONB DEFAULT '{}', -- { dataVal, dataAge, familyFlg, etc. }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(form_schema_id, name)
);

-- フィールドオプションテーブル（select, radio, checkbox用）
CREATE TABLE field_options (
  id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  price_value INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,

  -- 条件分岐用メタデータ
  metadata JSONB DEFAULT '{}', -- { dataVal, dataAge, etc. }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 条件分岐ルールテーブル
CREATE TABLE conditional_rules (
  id SERIAL PRIMARY KEY,
  target_field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  condition_type VARCHAR(50) NOT NULL, -- 'show_if', 'hide_if', 'enable_if', 'disable_if'

  -- 条件設定
  source_field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  operator VARCHAR(50) NOT NULL, -- 'equals', 'not_equals', 'contains', 'greater_than', etc.
  compare_value VARCHAR(255),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_form_schemas_shop_id ON form_schemas(shop_id);
CREATE INDEX idx_form_schemas_category ON form_schemas(category);
CREATE INDEX idx_form_fields_form_schema_id ON form_fields(form_schema_id);
CREATE INDEX idx_field_options_field_id ON field_options(field_id);
CREATE INDEX idx_conditional_rules_target_field_id ON conditional_rules(target_field_id);
CREATE INDEX idx_conditional_rules_source_field_id ON conditional_rules(source_field_id);

-- RLSポリシー設定
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditional_rules ENABLE ROW LEVEL SECURITY;

-- 読み取りは誰でもOK
CREATE POLICY "Anyone can view form schemas" ON form_schemas FOR SELECT USING (true);
CREATE POLICY "Anyone can view form fields" ON form_fields FOR SELECT USING (true);
CREATE POLICY "Anyone can view field options" ON field_options FOR SELECT USING (true);
CREATE POLICY "Anyone can view conditional rules" ON conditional_rules FOR SELECT USING (true);

-- 書き込みは認証済みユーザーのみ
CREATE POLICY "Authenticated users can insert form schemas" ON form_schemas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update form schemas" ON form_schemas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete form schemas" ON form_schemas FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert form fields" ON form_fields FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update form fields" ON form_fields FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete form fields" ON form_fields FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert field options" ON field_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update field options" ON field_options FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete field options" ON field_options FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert conditional rules" ON conditional_rules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update conditional rules" ON conditional_rules FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete conditional rules" ON conditional_rules FOR DELETE USING (auth.role() = 'authenticated');

-- コメント追加
COMMENT ON TABLE form_schemas IS 'フォームビルダーで作成されたフォームの定義';
COMMENT ON TABLE form_fields IS 'フォーム内の各フィールドの定義';
COMMENT ON TABLE field_options IS 'セレクト/ラジオ/チェックボックスの選択肢';
COMMENT ON TABLE conditional_rules IS '条件分岐ルール（data-val, data-ageなど）';
