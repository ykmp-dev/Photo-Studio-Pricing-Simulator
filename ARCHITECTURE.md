# Photo Studio Pricing Simulator - アーキテクチャドキュメント

## 目次
1. [システム概要](#システム概要)
2. [フォームビルダー - ドラフト/公開機能](#フォームビルダー---ドラフト公開機能)
3. [エラーハンドリングのベストプラクティス](#エラーハンドリングのベストプラクティス)
4. [データベーススキーマ](#データベーススキーマ)
5. [トラブルシューティング](#トラブルシューティング)
6. [既知の問題と対応方法](#既知の問題と対応方法)

---

## システム概要

### 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **バックエンド**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS
- **ノードエディタ**: React Flow
- **デプロイ**: GitHub Pages

### ディレクトリ構造
```
Photo-Studio-Pricing-Simulator/
├── frontend/
│   ├── src/
│   │   ├── components/       # React コンポーネント
│   │   │   ├── admin/        # 管理画面コンポーネント
│   │   │   └── ...
│   │   ├── pages/            # ページコンポーネント
│   │   ├── services/         # API サービス層
│   │   ├── types/            # TypeScript 型定義
│   │   └── utils/            # ユーティリティ関数
│   └── ...
├── supabase/
│   └── migrations/           # データベースマイグレーション
└── ARCHITECTURE.md           # このドキュメント
```

---

## フォームビルダー - ドラフト/公開機能

### 概要
フォームビルダーには「下書き」と「公開」の2つの状態があります。
これにより、管理者は設計中のフォームがエンドユーザーに表示されることを防ぎます。

### データモデル

#### FormSchema テーブル
```sql
CREATE TABLE form_schemas (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  -- ... その他のカラム
);
```

**重要なカラム:**
- `status`: フォームの状態 (`'draft'` | `'published'`)
- `published_at`: 公開された日時（公開時に自動設定）

### ワークフロー

```
┌─────────────┐
│ フォーム作成 │
└──────┬──────┘
       │ status = 'draft'
       ▼
┌─────────────┐     ┌──────────────┐
│ 下書き編集   │────→│ ノードビュー  │
│ (管理画面)   │     │ (専用ページ)  │
└──────┬──────┘     └──────┬───────┘
       │                    │
       │ ローカル編集        │ ローカル編集
       │ (DBに保存しない)    │ (DBに保存しない)
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│ 下書き保存   │     │ 下書き保存    │
└──────┬──────┘     └──────┬───────┘
       │                    │
       │ status = 'draft'   │
       └────────┬───────────┘
                ▼
         ┌─────────────┐
         │ 公開ボタン   │
         └──────┬──────┘
                │ status = 'published'
                │ published_at = NOW()
                ▼
         ┌─────────────┐
         │ エンドユーザー│
         │ に表示       │
         └─────────────┘
```

### コンポーネント構成

#### 1. FormNodeViewPage (ノードビュー専用ページ)
**場所**: `/frontend/src/pages/FormNodeViewPage.tsx`

**責務**:
- ノードビューの全画面表示
- ローカルステート管理（編集内容はメモリ上のみ）
- 下書き保存/公開の制御

**重要な状態**:
```typescript
const [form, setForm] = useState<FormSchemaWithBlocks | null>(null)      // DBから取得したフォーム
const [localBlocks, setLocalBlocks] = useState<FormBlock[]>([])         // ローカル編集中のブロック
const [hasChanges, setHasChanges] = useState(false)                     // 未保存の変更フラグ
const [saving, setSaving] = useState(false)                             // 保存中フラグ
```

**エラーハンドリング**:
```typescript
// ❌ 悪い例
try {
  await publishFormSchema(form.id)
  alert('公開しました')
} catch (err) {
  alert('失敗しました')
}

// ✅ 良い例
try {
  setSaving(true)
  await publishFormSchema(form.id)
  alert('フォームを公開しました')
  await loadFormAndCategories() // データを再読み込み
} catch (err) {
  console.error('Failed to publish:', err)
  const errorMessage = err instanceof Error ? err.message : String(err)
  alert(`公開に失敗しました: ${errorMessage}`)
} finally {
  setSaving(false)
}
```

#### 2. FormManager (リストビュー)
**場所**: `/frontend/src/components/admin/FormManager.tsx`

**責務**:
- フォーム一覧表示
- フォーム作成・編集・削除
- 公開/下書き状態の切り替え

**UI表示**:
```typescript
{selectedForm.status === 'published' && (
  <span className="text-green-600 font-semibold">● 公開中</span>
)}
{selectedForm.status === 'draft' && (
  <span className="text-yellow-600 font-semibold">● 下書き</span>
)}
```

#### 3. FormBuilderCanvas (ノードエディタ)
**場所**: `/frontend/src/components/admin/FormBuilderCanvas.tsx`

**責務**:
- React Flow を使ったノードベースUI
- ブロックの追加・編集・削除・接続
- 自動レイアウト・バリデーション

**重要**: このコンポーネントは親からの`onBlockUpdate`を呼ぶだけで、直接DBに保存しません。

### サービス層

**場所**: `/frontend/src/services/formBuilderService.ts`

#### 公開関連API

```typescript
/**
 * フォームを公開する
 * @param id フォームID
 * @returns 更新されたフォーム
 * @throws Supabaseエラー
 */
export async function publishFormSchema(id: number): Promise<FormSchema> {
  const { data, error } = await supabase
    .from('form_schemas')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * フォームを下書きに戻す
 * @param id フォームID
 * @returns 更新されたフォーム
 * @throws Supabaseエラー
 */
export async function unpublishFormSchema(id: number): Promise<FormSchema> {
  const { data, error } = await supabase
    .from('form_schemas')
    .update({
      status: 'draft',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 撮影カテゴリIDでフォームを取得（エンドユーザー向け・公開済みのみ）
 */
export async function getFormByShootingCategory(
  shopId: number,
  shootingCategoryId: number
): Promise<FormSchemaWithBlocks | null> {
  const { data: formData, error: formError } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shooting_category_id', shootingCategoryId)
    .eq('is_active', true)
    .eq('status', 'published')  // ← 公開済みのみ
    .single()

  if (formError) {
    if (formError.code === 'PGRST116') {
      return null // データが見つからない場合
    }
    throw formError
  }

  // ブロックを取得...
}
```

---

## エラーハンドリングのベストプラクティス

### 1. 必須パターン

#### すべての非同期処理に try-catch を追加
```typescript
// ❌ 悪い例
const handleSave = async () => {
  await saveData()
  alert('保存しました')
}

// ✅ 良い例
const handleSave = async () => {
  try {
    setLoading(true)
    await saveData()
    alert('保存しました')
  } catch (err) {
    console.error('Failed to save:', err)
    alert(`保存に失敗しました: ${getErrorMessage(err)}`)
  } finally {
    setLoading(false)
  }
}
```

#### ローディング状態を必ず管理
```typescript
const [loading, setLoading] = useState(false)

const handleAction = async () => {
  try {
    setLoading(true)
    await performAction()
  } catch (err) {
    // エラー処理
  } finally {
    setLoading(false) // ← finally で必ず解除
  }
}

// UIで使用
<button disabled={loading}>
  {loading ? '処理中...' : 'ボタン'}
</button>
```

### 2. エラーメッセージのユーザーフレンドリー化

#### エラーユーティリティ関数
**場所**: `/frontend/src/utils/errorMessages.ts`

```typescript
/**
 * エラーオブジェクトから人間が読めるメッセージを抽出
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return String(err.message)
  }
  return '不明なエラーが発生しました'
}

/**
 * Supabaseエラーコードに応じたメッセージ
 */
export function getSupabaseErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'

  // Supabase特有のエラーコード
  const errorCodes: Record<string, string> = {
    'PGRST116': 'データが見つかりませんでした',
    '23505': '既に同じデータが存在します',
    '23503': '関連するデータが存在しません',
    '42501': '権限がありません',
  }

  const code = error.code || error.error_code
  return errorCodes[code] || error.message || 'データベースエラーが発生しました'
}
```

### 3. ネットワークエラーのリトライ

```typescript
/**
 * リトライ付きフェッチ
 * @param fn 実行する関数
 * @param maxRetries 最大リトライ回数
 * @param delay リトライ間隔（ミリ秒）
 */
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === maxRetries - 1) throw err

      // ネットワークエラーの場合のみリトライ
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn(`リトライ ${i + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        continue
      }

      throw err // その他のエラーは即座にスロー
    }
  }
  throw new Error('Maximum retries exceeded')
}

// 使用例
const loadData = async () => {
  try {
    const data = await fetchWithRetry(() => getFormWithBlocks(formId))
    setForm(data)
  } catch (err) {
    alert('データの読み込みに失敗しました。ネットワーク接続を確認してください。')
  }
}
```

### 4. バリデーションエラー

```typescript
/**
 * フォームバリデーション
 */
function validateForm(form: FormSchemaWithBlocks): string[] {
  const errors: string[] = []

  if (!form.name || form.name.trim().length === 0) {
    errors.push('フォーム名を入力してください')
  }

  if (form.blocks.length === 0) {
    errors.push('少なくとも1つのブロックを追加してください')
  }

  // 到達不可能なブロックチェック
  const reachableIds = new Set<number>()
  const traverse = (blockId: number) => {
    if (reachableIds.has(blockId)) return
    reachableIds.add(blockId)

    const block = form.blocks.find(b => b.id === blockId)
    // 子ブロックを探索...
  }

  const unreachable = form.blocks.filter(b => !reachableIds.has(b.id))
  if (unreachable.length > 0) {
    errors.push(`到達不可能なブロックが${unreachable.length}個あります`)
  }

  return errors
}

// 使用例
const handlePublish = async () => {
  const errors = validateForm(form)

  if (errors.length > 0) {
    alert(`公開できません:\n${errors.join('\n')}`)
    return
  }

  // 公開処理...
}
```

---

## データベーススキーマ

### form_schemas テーブル
```sql
CREATE TABLE form_schemas (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shooting_category_id INTEGER REFERENCES shooting_categories(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_form_schemas_status ON form_schemas(status);
CREATE INDEX idx_form_schemas_shop_id ON form_schemas(shop_id);
```

### form_blocks テーブル
```sql
CREATE TABLE form_blocks (
  id SERIAL PRIMARY KEY,
  form_schema_id INTEGER NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL, -- 'text', 'heading', 'yes_no', 'choice', 'category_reference'
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  show_condition JSONB, -- { type, block_id, value }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_form_blocks_form_schema_id ON form_blocks(form_schema_id);
```

### マイグレーション履歴

#### 014_add_form_schema_status.sql
**適用日**: 2024-12-XX
**内容**: `form_schemas`テーブルに`status`と`published_at`カラムを追加

```sql
ALTER TABLE form_schemas
ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

ALTER TABLE form_schemas
ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_form_schemas_status ON form_schemas(status);

UPDATE form_schemas SET status = 'draft' WHERE status IS NULL;
```

**適用方法**:
1. Supabaseダッシュボード → SQL Editor
2. SQLを貼り付けて実行
3. エラーがないことを確認

---

## トラブルシューティング

### 問題1: 下書き保存ができない

**症状**:
- 「下書き保存」ボタンをクリックすると「下書き保存に失敗しました」というエラーが表示される

**原因**:
- データベースに`status`カラムが存在しない
- マイグレーション`014_add_form_schema_status.sql`が未適用

**解決方法**:
```sql
-- Supabaseダッシュボードで以下を実行
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'form_schemas';

-- statusカラムがない場合、マイグレーションを実行
-- (014_add_form_schema_status.sql の内容をコピー&ペースト)
```

### 問題2: 公開済みフォームがエンドユーザーに表示されない

**症状**:
- 管理画面で「公開中」と表示されているが、エンドユーザー画面で表示されない

**原因**:
- `is_active`が`false`になっている
- `shooting_category_id`が正しく設定されていない

**解決方法**:
```sql
-- フォームの状態を確認
SELECT id, name, status, is_active, shooting_category_id, published_at
FROM form_schemas
WHERE id = <フォームID>;

-- is_activeがfalseの場合
UPDATE form_schemas
SET is_active = true
WHERE id = <フォームID>;
```

### 問題3: ブロック削除時に確認ダイアログが2回表示される

**症状**:
- ブロック削除ボタンをクリックすると、確認ダイアログが2回出る

**原因**:
- 親コンポーネント（FormNodeViewPage）とモーダル（BlockEditModal）の両方で`confirm()`を呼んでいる

**解決方法**:
親コンポーネントの`confirm()`を削除:
```typescript
// ❌ 悪い例
const handleBlockDelete = (blockId: number) => {
  if (!confirm('削除しますか？')) return
  setLocalBlocks(prev => prev.filter(b => b.id !== blockId))
}

// ✅ 良い例
const handleBlockDelete = (blockId: number) => {
  setLocalBlocks(prev => prev.filter(b => b.id !== blockId))
}
```

モーダル側でのみ確認:
```typescript
// BlockEditModal内
<button onClick={() => {
  if (confirm('このブロックを削除しますか？')) {
    onDelete()
  }
}}>
  削除
</button>
```

### 問題4: 未保存の変更があるのに保存ボタンが無効化されている

**症状**:
- ノードを編集したのに「下書き保存」ボタンがグレーアウトしている

**原因**:
- `setHasChanges(true)`が呼ばれていない
- 状態更新のタイミングがずれている

**解決方法**:
```typescript
const handleBlockUpdate = (blockId: number, updates: Partial<FormBlock>) => {
  setLocalBlocks(prevBlocks =>
    prevBlocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    )
  )
  setHasChanges(true) // ← 必ず設定
}
```

---

## 既知の問題と対応方法

### 1. 大量のブロック削除時のパフォーマンス

**問題**:
下書き保存時に全ブロックを削除→再作成しているため、ブロック数が多いと時間がかかる

**現在の実装**:
```typescript
// 既存のブロックを全削除
await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))

// 新しいブロックを作成
for (const block of localBlocks) {
  await createFormBlock(block)
}
```

**改善案**:
差分更新アルゴリズムを実装
```typescript
// 削除するブロック
const blocksToDelete = form.blocks.filter(
  existingBlock => !localBlocks.some(local => local.id === existingBlock.id)
)

// 新規作成するブロック
const blocksToCreate = localBlocks.filter(
  local => !form.blocks.some(existing => existing.id === local.id)
)

// 更新するブロック
const blocksToUpdate = localBlocks.filter(
  local => form.blocks.some(existing => existing.id === local.id)
)

await Promise.all([
  ...blocksToDelete.map(b => deleteFormBlock(b.id)),
  ...blocksToCreate.map(b => createFormBlock(b)),
  ...blocksToUpdate.map(b => updateFormBlock(b.id, b))
])
```

### 2. 未保存の変更がある状態でページを離れる

**問題**:
編集中のデータが失われる可能性がある

**対応方法**:
`beforeunload`イベントでアラートを表示
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [hasChanges])
```

### 3. 同時編集による競合

**問題**:
複数の管理者が同じフォームを同時に編集すると、後から保存した方が上書きされる

**現在の対応**:
なし（単一管理者を前提）

**将来的な改善案**:
- Optimistic Lockingを実装（`version`カラムを追加）
- WebSocketでリアルタイム同期
- 編集中ロック機能

---

## チェックリスト

### 新機能実装時

- [ ] すべての非同期処理に try-catch を追加
- [ ] ローディング状態を管理
- [ ] エラーメッセージをユーザーフレンドリーに
- [ ] 成功時のフィードバックを追加
- [ ] バリデーションを実装
- [ ] エッジケースを考慮（空データ、ネットワークエラーなど）
- [ ] 型定義を追加（TypeScript）
- [ ] JSDocコメントを追加
- [ ] このドキュメントを更新

### デプロイ前

- [ ] `npm run build` が成功すること
- [ ] TypeScriptエラーがないこと
- [ ] コンソールエラーがないこと
- [ ] 必要なマイグレーションが適用されていること
- [ ] RLSポリシーが正しく設定されていること

---

## 更新履歴

| 日付 | 内容 | 担当 |
|------|------|------|
| 2024-12-18 | 初版作成 - ドラフト/公開機能とエラーハンドリング | Claude |

---

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [React Flow Documentation](https://reactflow.dev/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
