-- 公開用ブロックテーブルを作成
-- エンドユーザーが見るのはこちら（編集中も安定）

CREATE TABLE published_blocks (
  id SERIAL PRIMARY KEY,
  form_schema_id INTEGER NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  show_condition JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_published_blocks_form_schema_id ON published_blocks(form_schema_id);

-- RLSポリシー設定
ALTER TABLE published_blocks ENABLE ROW LEVEL SECURITY;

-- 読み取りは誰でもOK（エンドユーザー向け）
CREATE POLICY "Anyone can view published blocks" ON published_blocks FOR SELECT USING (true);

-- 書き込みは認証済みユーザーのみ（公開時のコピー）
CREATE POLICY "Authenticated users can insert published blocks" ON published_blocks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update published blocks" ON published_blocks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete published blocks" ON published_blocks FOR DELETE USING (auth.role() = 'authenticated');

-- コメント追加
COMMENT ON TABLE published_blocks IS 'エンドユーザーに表示される公開済みブロック（form_blocksから公開時にコピー）';
COMMENT ON COLUMN published_blocks.published_at IS 'このブロックが公開された日時';

-- 既存の公開済みフォームのブロックをコピー
INSERT INTO published_blocks (
  form_schema_id,
  block_type,
  content,
  sort_order,
  metadata,
  show_condition,
  created_at,
  updated_at,
  published_at
)
SELECT
  fb.form_schema_id,
  fb.block_type,
  fb.content,
  fb.sort_order,
  fb.metadata,
  fb.show_condition,
  fb.created_at,
  fb.updated_at,
  NOW()
FROM form_blocks fb
INNER JOIN form_schemas fs ON fb.form_schema_id = fs.id
WHERE fs.status = 'published';
