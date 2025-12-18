# UI操作テストシナリオ

このドキュメントは、UIの動作を検証するためのテストシナリオです。
ブラウザのコンソールで実行して問題を特定できます。

## 前提条件チェック

### 1. published_blocksテーブルの存在確認

Supabaseダッシュボード → SQL Editor で実行:

```sql
-- テーブル存在確認
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'published_blocks'
);

-- 結果: true なら存在、false なら未作成
```

**結果がfalseの場合**: マイグレーションを適用してください
- `supabase/migrations/015_create_published_blocks.sql`
- `supabase/migrations/016_create_save_form_blocks_function.sql`

### 2. save_form_blocks関数の存在確認

```sql
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'save_form_blocks'
);

-- 結果: true なら存在、false なら未作成
```

## テストシナリオ

### シナリオ1: ブロック追加テスト

#### 手順:
1. フォームビルダーページを開く
2. フォームを選択
3. ブロック追加ボタン（例: + テキスト）をクリック
4. ブラウザコンソールを開く

#### 期待されるログ:
```
[INFO] [FormNodeViewPage] USER ACTION: Block add
[INFO] [FormNodeViewPage] Adding new block to local state
[INFO] [FormNodeViewPage] STATE CHANGE: hasChanges false → true
[INFO] [FormNodeViewPage] Block added to local state
```

#### 確認ポイント:
- ✅ ブロックがキャンバスに表示される
- ✅ 「● 未保存の変更」が表示される
- ✅ 保存ボタンが有効になる

#### エラーの場合:
- コンソールにエラーが表示されていないか確認
- ネットワークタブで失敗したリクエストがないか確認

---

### シナリオ2: 保存テスト

#### 手順:
1. ブロックを追加（シナリオ1完了）
2. 「保存」ボタンをクリック
3. ブラウザコンソールを確認

#### 期待されるログ:
```
[INFO] [FormNodeViewPage] FUNCTION START: handleSave
[INFO] [FormNodeViewPage] USER ACTION: Save clicked
[INFO] [FormNodeViewPage] Starting save process
[INFO] [FormNodeViewPage] API REQUEST: RPC save_form_blocks
[INFO] [FormNodeViewPage] API RESPONSE: RPC save_form_blocks Success
[INFO] [FormNodeViewPage] Form saved successfully
[INFO] [FormNodeViewPage] FUNCTION END: handleSave Success
```

#### 確認ポイント:
- ✅ 「保存しました」アラートが表示される
- ✅ 「保存」ボタンが「保存済み」に変わる
- ✅ 「● 未保存の変更」が消える

#### エラーの場合:
```
[ERROR] [FormNodeViewPage] API ERROR: RPC save_form_blocks
```
→ `save_form_blocks`関数が存在しないか、form_blocksテーブルにアクセスできない

**対処法**: マイグレーション016を適用

---

### シナリオ3: 更新（お客様ページへの反映）テスト

#### 手順:
1. ブロックを保存（シナリオ2完了）
2. 「更新」ボタンをクリック
3. 確認ダイアログでOKをクリック
4. ブラウザコンソールを確認

#### 期待されるログ:
```
[INFO] [FormNodeViewPage] FUNCTION START: handleUpdate
[INFO] [FormNodeViewPage] USER ACTION: Update clicked
[INFO] [FormNodeViewPage] Starting update process
[INFO] [FormNodeViewPage] API REQUEST: PATCH forms/1/publish
[INFO] [FormNodeViewPage] API RESPONSE: PATCH forms/1/publish Success
[INFO] [FormNodeViewPage] Form updated successfully
[INFO] [FormNodeViewPage] FUNCTION END: handleUpdate Success
```

#### 確認ポイント:
- ✅ 「フォームを更新しました」アラートが表示される
- ✅ 最終反映日時が更新される

#### エラーの場合:
```
[ERROR] [FormNodeViewPage] API ERROR: PATCH forms/1/publish
```
→ published_blocksテーブルが存在しないか、アクセスできない

**対処法**: マイグレーション015を適用

---

### シナリオ4: お客様ページでの表示確認

#### 手順:
1. 更新完了（シナリオ3完了）
2. お客様ページ（/simulator）を開く
3. 撮影カテゴリを選択
4. ブラウザコンソールを確認

#### 期待される動作:
- ✅ 更新したフォームが表示される
- ✅ 追加したブロックが表示される

#### 確認SQL:
Supabaseダッシュボードで実行:

```sql
-- published_blocksのデータ確認
SELECT * FROM published_blocks
WHERE form_schema_id = 1  -- フォームIDを適宜変更
ORDER BY sort_order;

-- form_schemasの更新日時確認
SELECT id, name, published_at, updated_at
FROM form_schemas
WHERE id = 1;  -- フォームIDを適宜変更
```

#### エラーの場合:
- published_blocksにデータがない → 更新処理が失敗している
- published_blocksはあるがお客様ページに表示されない → getFormByShootingCategoryの実装に問題

---

## デバッグ用SQLクエリ

### すべてのテーブルを確認
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('form_schemas', 'form_blocks', 'published_blocks')
ORDER BY table_name;
```

### form_blocks と published_blocks の比較
```sql
-- form_blocks（管理者編集用）
SELECT 'form_blocks' as source, count(*) as count
FROM form_blocks
WHERE form_schema_id = 1

UNION ALL

-- published_blocks（お客様表示用）
SELECT 'published_blocks' as source, count(*) as count
FROM published_blocks
WHERE form_schema_id = 1;
```

### 最新の更新履歴
```sql
SELECT
  fs.id,
  fs.name,
  fs.updated_at as last_saved,
  fs.published_at as last_published,
  (SELECT count(*) FROM form_blocks WHERE form_schema_id = fs.id) as draft_blocks,
  (SELECT count(*) FROM published_blocks WHERE form_schema_id = fs.id) as published_blocks
FROM form_schemas fs
ORDER BY fs.updated_at DESC
LIMIT 5;
```

---

## トラブルシューティング

### 問題: ブロック追加ができない

**症状**:
- ブロック追加ボタンをクリックしても何も起こらない
- コンソールにエラーが出る

**原因候補**:
1. JavaScriptエラー
2. form が null
3. localBlocks の状態管理エラー

**確認方法**:
```javascript
// ブラウザコンソールで実行
console.log('form:', form)
console.log('localBlocks:', localBlocks)
console.log('hasChanges:', hasChanges)
```

---

### 問題: 保存ができない

**症状**:
- 保存ボタンをクリックするとエラー
- 「保存に失敗しました」アラートが表示される

**原因候補**:
1. `save_form_blocks`関数が存在しない
2. form_blocksテーブルへのアクセス権限がない

**確認方法**:
Supabaseダッシュボードで実行:
```sql
-- 関数の存在確認
SELECT proname FROM pg_proc WHERE proname = 'save_form_blocks';

-- form_blocksテーブルへのアクセス確認
SELECT * FROM form_blocks LIMIT 1;
```

**対処法**: マイグレーション016を適用

---

### 問題: 更新してもお客様ページに反映されない

**症状**:
- 更新ボタンをクリックしても成功メッセージが出る
- でもお客様ページで変更が表示されない

**原因候補**:
1. published_blocksテーブルが存在しない
2. published_blocksにデータがコピーされていない
3. getFormByShootingCategoryがpublished_blocksを見ていない

**確認方法**:
```sql
-- published_blocksのデータ確認
SELECT * FROM published_blocks
WHERE form_schema_id = 1
ORDER BY sort_order;

-- 更新日時確認
SELECT published_at FROM form_schemas WHERE id = 1;
```

**対処法**: マイグレーション015を適用

---

## ログレベルの説明

| ログレベル | 説明 | 例 |
|-----------|------|-----|
| INFO | 正常な動作 | USER ACTION, API REQUEST |
| WARN | 警告（動作は継続） | データが空 |
| ERROR | エラー（処理失敗） | API ERROR |
| DEBUG | デバッグ情報 | 詳細なデータ |

---

## 次のステップ

1. ✅ 前提条件チェック（テーブル・関数の存在確認）
2. ✅ シナリオ1-4を順番に実行
3. ✅ エラーが出た場合はトラブルシューティングを参照
4. ✅ 問題が解決しない場合はコンソールログとSQLクエリ結果を共有

---

## 自動テストスクリプト（将来実装予定）

```typescript
// test/integration/form-builder.test.ts
describe('Form Builder Integration Tests', () => {
  test('ブロック追加 → 保存 → 更新 → お客様ページ表示', async () => {
    // 1. ブロック追加
    const addButton = screen.getByText('+ テキスト')
    fireEvent.click(addButton)
    expect(screen.getByText('● 未保存の変更')).toBeInTheDocument()

    // 2. 保存
    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)
    await waitFor(() => {
      expect(screen.getByText('保存済み')).toBeInTheDocument()
    })

    // 3. 更新
    const updateButton = screen.getByText('更新')
    fireEvent.click(updateButton)
    window.confirm = jest.fn(() => true)
    await waitFor(() => {
      expect(screen.getByText('フォームを更新しました')).toBeInTheDocument()
    })

    // 4. お客様ページで確認
    // TODO: 実装
  })
})
```
