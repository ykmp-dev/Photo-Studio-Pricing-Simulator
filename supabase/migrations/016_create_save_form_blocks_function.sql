-- トランザクション化された保存関数
-- form_blocksを原子的に更新する（全削除→全挿入）

CREATE OR REPLACE FUNCTION save_form_blocks(
  p_form_id INTEGER,
  p_blocks JSONB
) RETURNS void AS $$
BEGIN
  -- 既存のブロックを全削除
  DELETE FROM form_blocks WHERE form_schema_id = p_form_id;

  -- 新しいブロックを全挿入
  INSERT INTO form_blocks (
    form_schema_id,
    block_type,
    content,
    sort_order,
    metadata,
    show_condition,
    created_at,
    updated_at
  )
  SELECT
    p_form_id,
    (block->>'block_type')::VARCHAR(50),
    block->>'content',
    (block->>'sort_order')::INTEGER,
    COALESCE((block->'metadata')::JSONB, '{}'::JSONB),
    (block->'show_condition')::JSONB,
    NOW(),
    NOW()
  FROM jsonb_array_elements(p_blocks) AS block;

  -- フォームの更新日時を更新
  UPDATE form_schemas
  SET updated_at = NOW()
  WHERE id = p_form_id;
END;
$$ LANGUAGE plpgsql;

-- コメント追加
COMMENT ON FUNCTION save_form_blocks(INTEGER, JSONB) IS 'フォームブロックをトランザクション内で保存（全削除→全挿入）';
