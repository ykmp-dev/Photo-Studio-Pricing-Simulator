-- フォームスキーマにステータスと公開日時カラムを追加

-- statusカラムを追加（draft/published）
ALTER TABLE form_schemas
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- published_atカラムを追加（公開日時）
ALTER TABLE form_schemas
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- statusにインデックスを追加（公開済みフォームのクエリを高速化）
CREATE INDEX idx_form_schemas_status ON form_schemas(status);

-- コメント追加
COMMENT ON COLUMN form_schemas.status IS 'フォームのステータス（draft: 下書き、published: 公開中）';
COMMENT ON COLUMN form_schemas.published_at IS 'フォームが公開された日時';

-- 既存のフォームをすべてdraft状態にする（安全のため）
UPDATE form_schemas SET status = 'draft' WHERE status IS NULL;
