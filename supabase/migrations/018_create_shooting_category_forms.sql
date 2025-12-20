-- shooting_category_forms テーブル作成
-- フォームビルダーで作成したフォーム設定をJSON形式で保存

CREATE TABLE IF NOT EXISTS shooting_category_forms (
  id bigserial PRIMARY KEY,
  shop_id bigint NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shooting_category_id bigint NOT NULL REFERENCES shooting_categories(id) ON DELETE CASCADE,
  form_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- 1つの撮影カテゴリにつき1つのフォーム設定のみ
  UNIQUE(shop_id, shooting_category_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_shooting_category_forms_shop_id
  ON shooting_category_forms(shop_id);

CREATE INDEX IF NOT EXISTS idx_shooting_category_forms_shooting_category_id
  ON shooting_category_forms(shooting_category_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_shooting_category_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shooting_category_forms_updated_at
  BEFORE UPDATE ON shooting_category_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_shooting_category_forms_updated_at();

-- RLSポリシー
ALTER TABLE shooting_category_forms ENABLE ROW LEVEL SECURITY;

-- 認証されたユーザーは閲覧・編集可能
CREATE POLICY "shooting_category_forms_select_policy"
  ON shooting_category_forms
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "shooting_category_forms_insert_policy"
  ON shooting_category_forms
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "shooting_category_forms_update_policy"
  ON shooting_category_forms
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "shooting_category_forms_delete_policy"
  ON shooting_category_forms
  FOR DELETE TO authenticated
  USING (true);

-- コメント追加
COMMENT ON TABLE shooting_category_forms IS 'フォームビルダーで作成したフォーム設定（JSON保存）';
COMMENT ON COLUMN shooting_category_forms.form_data IS 'FormBuilderData型のJSONデータ';
