# FormNodeViewPage UI/UX リファクタリング計画

## 問題点の分析

### 現在の実装の問題

1. **重複した処理フロー**
   - `handleSaveDraft()`: form_blocks全削除 → 全作成 → status='draft'
   - `handlePublish()`: form_blocks全削除 → 全作成 → published_blocksにコピー → status='published'
   - 両方とも同じことをしているため、ユーザーが混乱する

2. **非効率な保存処理**
   - 毎回全ブロックを削除して再作成（O(2n) operations）
   - トランザクションがないため、途中で失敗すると不整合が起きる可能性

3. **不完全なUI**
   - FormNodeViewPageに非公開ボタンがない
   - FormManagerにはあるが、ノードビューからは戻らないと使えない

4. **ボタンの一貫性がない**
   - 下書き保存：変更がある時のみ有効
   - 公開：常に有効（変更がなくても押せる）
   - 非公開：ボタン自体がない

## リファクタリング設計

### データフロー（改善後）

```
┌──────────────┐
│ localBlocks  │ (メモリ上の編集中データ)
└──────┬───────┘
       │ 保存
       ↓
┌──────────────┐
│ form_blocks  │ (DBの下書きデータ)
└──────┬───────┘
       │ 公開
       ↓
┌────────────────────┐
│ published_blocks   │ (DBの公開データ - エンドユーザーが見る)
└────────────────────┘
       ↑
       │ 非公開
       └─────────────
```

### 新しいボタン設計

#### ボタン構成

1. **保存ボタン**
   - ラベル: "保存"（変更がある時）/ "保存済み"（変更がない時）
   - 色: グレー系
   - 有効条件: 変更がある時のみ
   - 処理: localBlocks → form_blocks に保存（status='draft'のまま）

2. **公開ボタン**
   - ラベル: "公開" / "変更を公開"
   - 色: 青色（プライマリアクション）
   - 有効条件:
     - 未公開の場合: 常に有効（下書きを公開）
     - 公開中の場合: 変更がある時のみ有効（更新を公開）
   - 処理:
     - 未保存の変更がある場合: 保存処理を実行
     - form_blocks → published_blocks にコピー
     - status='published' に設定

3. **非公開ボタン**
   - ラベル: "非公開に戻す"
   - 色: グレー系（セカンダリアクション）
   - 有効条件: status='published' の時のみ表示
   - 処理:
     - published_blocks を削除
     - status='draft' に設定

#### ボタン配置（ヘッダー右側）

```
[保存]  [公開]  [非公開に戻す]
```

### ステータス表示の改善

```
フォーム名
ノードビュー
● 公開中 | 最終公開: 2025-01-15 10:30
● 未保存の変更あり
```

または

```
フォーム名
ノードビュー
● 下書き | 最終保存: 2025-01-15 09:15
```

### 保存処理の改善

#### 現在の処理（非効率）

```typescript
// すべて削除
await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))

// すべて作成
for (const block of localBlocks) {
  await createFormBlock(block)
}
```

#### 改善案1: トランザクション化（推奨）

Supabaseのトランザクション機能を使って原子性を保証

```typescript
// 1つのトランザクションで全削除→全作成
await supabase.rpc('save_form_blocks', {
  p_form_id: form.id,
  p_blocks: JSON.stringify(localBlocks)
})
```

PostgreSQL関数:
```sql
CREATE OR REPLACE FUNCTION save_form_blocks(
  p_form_id INTEGER,
  p_blocks JSONB
) RETURNS void AS $$
BEGIN
  -- 全削除
  DELETE FROM form_blocks WHERE form_schema_id = p_form_id;

  -- 全挿入
  INSERT INTO form_blocks (form_schema_id, block_type, content, sort_order, metadata, show_condition)
  SELECT
    p_form_id,
    (block->>'block_type')::VARCHAR(50),
    block->>'content',
    (block->>'sort_order')::INTEGER,
    (block->'metadata')::JSONB,
    (block->'show_condition')::JSONB
  FROM jsonb_array_elements(p_blocks) AS block;
END;
$$ LANGUAGE plpgsql;
```

#### 改善案2: 増分更新（複雑だが最も効率的）

変更があったブロックのみUPDATE/INSERT/DELETE

```typescript
const existingBlockIds = form.blocks.map(b => b.id)
const localBlockIds = localBlocks.filter(b => b.id).map(b => b.id)

// 削除するブロック
const toDelete = existingBlockIds.filter(id => !localBlockIds.includes(id))

// 更新するブロック
const toUpdate = localBlocks.filter(b => b.id && existingBlockIds.includes(b.id))

// 作成するブロック
const toCreate = localBlocks.filter(b => !b.id)

// 実行
await Promise.all(toDelete.map(id => deleteFormBlock(id)))
await Promise.all(toUpdate.map(b => updateFormBlock(b.id, b)))
await Promise.all(toCreate.map(b => createFormBlock(b)))
```

**推奨**: 改善案1（トランザクション化）
- シンプルで理解しやすい
- 原子性が保証される
- パフォーマンスも十分

## 実装ステップ

### Phase 1: バックエンド強化（推奨）

1. [ ] `save_form_blocks` PostgreSQL関数を作成
2. [ ] マイグレーションファイル作成
3. [ ] formBuilderService.tsに `saveFormBlocks()` 関数追加

### Phase 2: フロントエンド改善

1. [ ] FormNodeViewPage.tsx の処理を整理
   - `handleSave()`: form_blocksに保存（トランザクション関数使用）
   - `handlePublish()`: 保存 → published_blocksにコピー
   - `handleUnpublish()`: published_blocks削除、status='draft'

2. [ ] UIボタンの追加・修正
   - 保存ボタンのラベル改善
   - 公開ボタンの条件修正
   - 非公開ボタンを追加

3. [ ] ステータス表示の改善
   - 最終保存日時
   - 最終公開日時
   - より明確な状態表示

### Phase 3: テスト

1. [ ] 下書き保存のテスト
2. [ ] 公開のテスト（未保存の変更がある場合 / ない場合）
3. [ ] 非公開のテスト
4. [ ] エラーハンドリングのテスト

## 期待される改善効果

### ユーザー体験

- ✅ 明確な操作フロー（保存 → 公開 → 非公開）
- ✅ ボタンの役割が直感的
- ✅ すべての操作がノードビューから可能

### パフォーマンス

- ✅ トランザクションによる原子性保証
- ✅ エラー時の不整合防止
- ✅ 1回のRPCコールで保存完了（往復回数削減）

### 保守性

- ✅ 重複コード削減
- ✅ 処理の責任が明確
- ✅ テストしやすい構造
