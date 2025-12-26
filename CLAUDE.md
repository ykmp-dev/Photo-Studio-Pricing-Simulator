# CLAUDE.md - AI アシスタント向けガイド

**最終更新**: 2025-12-26
**目的**: 写真館向け料金シミュレータープロジェクトの理解と開発貢献のための包括的ガイド（AI アシスタント向け）

---

## 目次

1. [クイックスタート](#クイックスタート)
2. [コードベース概要](#コードベース概要)
3. [アーキテクチャ](#アーキテクチャ)
4. [開発ワークフロー](#開発ワークフロー)
5. [重要な規約](#重要な規約)
6. [よくあるタスク](#よくあるタスク)
7. [重要な注意点](#重要な注意点)
8. [テスト・デプロイ](#テストデプロイ)
9. [参考ドキュメント](#参考ドキュメント)

---

## クイックスタート

### 初回セットアップ

```bash
# 1. フロントエンドディレクトリへ移動
cd frontend

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集してSupabase認証情報を設定

# 4. 開発サーバーを起動
npm run dev  # http://localhost:3000 で起動
```

### 変更を加える前に

1. **最近のコミットを確認**: `git log --oneline -10`
2. **開発ログを確認**: `.claude/DEVELOPMENT_LOG.md` を読む
3. **ビルドを確認**: `npm run build` が成功することを確認
4. **マイグレーション状態を確認**: `supabase/migrations/` の最新変更を確認

### 現在のブランチ戦略

- **メインブランチ**: `main` （本番環境）
- **Claudeブランチ**: `claude/*` （GitHub Actionsで自動マージ）
- **現在の作業ブランチ**: `claude/add-claude-documentation-PhdeZ`

---

## コードベース概要

### 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| **フロントエンド** | React + TypeScript | 18.2.0 |
| **ビルドツール** | Vite | 5.0.8 |
| **スタイリング** | Tailwind CSS | 3.3.6 |
| **データベース** | Supabase (PostgreSQL) | - |
| **認証** | Supabase Auth | - |
| **ビジュアルエディタ** | React Flow | 11.11.4 |
| **デプロイ** | GitHub Pages | - |
| **テスト** | Vitest + React Testing Library | 4.0.16 |

### プロジェクト構造

```
Photo-Studio-Pricing-Simulator/
├── frontend/                          # React アプリケーション
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                 # 管理画面コンポーネント
│   │   │   │   ├── FormBuilderCanvas.tsx    # ビジュアルノードエディタ（React Flow）
│   │   │   │   ├── FormNodeViewPage.tsx     # フルスクリーンノードビュー
│   │   │   │   ├── CategoryManager.tsx      # 3階層カテゴリ管理
│   │   │   │   └── BlockEditModal.tsx       # ブロック編集モーダル
│   │   │   └── customer/              # 顧客向けコンポーネント
│   │   │       └── ProductCategorySection.tsx
│   │   ├── pages/
│   │   │   ├── CustomerFormPageV3.tsx       # メイン顧客フォーム（V3）
│   │   │   ├── AdminPage.tsx                # 管理ダッシュボード
│   │   │   ├── FormBlockEditorPage.tsx      # フォームビルダーページ
│   │   │   └── LoginPage.tsx                # 認証ページ
│   │   ├── services/                  # Supabase API 抽象化
│   │   │   ├── formBuilderService.ts        # フォーム CRUD + 公開
│   │   │   ├── categoryService.ts           # カテゴリ操作
│   │   │   └── simulatorService.ts          # 顧客データ取得
│   │   ├── types/                     # TypeScript 型定義
│   │   │   ├── formBuilder.ts               # フォーム/ブロック型
│   │   │   ├── category.ts                  # カテゴリ型
│   │   │   └── campaign.ts                  # キャンペーン型
│   │   ├── utils/
│   │   │   ├── errorReporter.ts             # 自動ログ収集
│   │   │   └── logger.ts                    # ログユーティリティ
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx              # 認証状態管理
│   │   └── lib/
│   │       └── supabase.ts                  # Supabase クライアント設定
│   └── package.json
│
├── backend/                           # 軽量 Express.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── simulator.ts                 # 公開エンドポイント
│   │   │   └── admin.ts                     # 保護されたエンドポイント
│   │   ├── middleware/
│   │   │   └── auth.ts                      # JWT 検証
│   │   └── lib/
│   │       └── supabase.ts                  # Supabase クライアント
│   └── package.json
│
├── supabase/
│   └── migrations/                    # データベースマイグレーション（22ファイル）
│       ├── 001_*.sql                        # 基本テーブル
│       ├── 005_*.sql                        # ⚠️ 重要: RLS ポリシー
│       ├── 014_*.sql                        # 下書き/公開ステータス
│       ├── 015_*.sql                        # 公開ブロックテーブル
│       └── 016_*.sql                        # アトミック保存関数
│
├── .github/workflows/
│   ├── deploy.yml                     # GitHub Pages 自動デプロイ
│   └── auto-merge.yml                 # claude/* ブランチ自動マージ
│
├── .claude/                           # 開発ドキュメント
│   ├── DEVELOPMENT_GUIDELINES.md      # 開発ガイドライン
│   ├── DEVELOPMENT_LOG.md             # 変更履歴
│   ├── STATUS.md                      # 現在の状態
│   └── QUICKSTART.md                  # クイックリファレンス
│
├── scripts/
│   ├── diagnose.sql                   # DB 診断
│   └── setup-e2e-tests.sh             # E2E テストセットアップ
│
├── ARCHITECTURE.md                    # アーキテクチャドキュメント
├── TROUBLESHOOTING.md                 # よくある問題と解決方法
├── README.md                          # メイン README
└── CLAUDE.md                          # このファイル
```

---

## アーキテクチャ

### 設計原則

1. **Supabase ファースト**: ビジネスロジックの大部分は PostgreSQL に配置（RLS、関数、トリガー）
2. **型安全性**: 全体で厳格な TypeScript 使用
3. **サービス層パターン**: すべての Supabase 呼び出しをサービスに抽象化
4. **コンポーネント構成**: 関数コンポーネント + フック（クラスコンポーネントなし）
5. **モバイルファースト**: すべての UI でスマートフォン表示を優先
6. **プログレッシブディスクロージャー**: ユーザーの回答に応じてフォームブロックを段階的に表示

### データモデル

#### 3階層カテゴリシステム

```
ShootingCategory（撮影カテゴリ）
  └── ProductCategory（商品カテゴリ）[via shooting_product_associations]
        └── Item（アイテム）

例:
七五三
  ├── ヘアセット
  │     ├─ 基本ヘアセット ¥5,000
  │     └─ 日本髪ヘアセット ¥8,000
  └── メイク
        ├─ ナチュラルメイク ¥3,000
        └─ フルメイク ¥5,000
```

**主要テーブル**:
- `shooting_categories` - トップレベル（例: 七五三、成人式）
- `product_categories` - 中間レベル（例: ヘア、メイク、衣装）
- `items` - 最下層レベル（例: フルメイク ¥5,500）
- `shooting_product_associations` - 多対多リレーション

#### フォームビルダーシステム

```
FormSchema (form_schemas)
  ├── status: 'draft' | 'published'
  ├── published_at: timestamp
  └── FormBlocks (form_blocks / published_blocks)
        ├── BlockType: 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference'
        ├── content: string
        ├── metadata: JSONB（柔軟なデータ）
        └── show_condition: JSONB（条件分岐ロジック）
```

**下書き/公開ワークフロー**:
1. フォーム作成（status: 'draft'）
2. `form_blocks` を編集（下書き版）
3. 下書き保存（`form_blocks` のみ更新）
4. 公開 → `form_blocks` を `published_blocks` にコピー、status: 'published' に設定
5. 顧客には `published_blocks` のみ表示
6. ライブ版に影響を与えずに下書き編集を継続可能

**ブロックタイプ**:
- `text` - プレーンテキストコンテンツ
- `heading` - セクション見出し
- `yes_no` - 二択条件分岐（Yes/No 質問）
- `choice` - 料金付き複数選択肢
- `category_reference` - 商品カテゴリへのリンク

**条件分岐ロジック** (`show_condition`):
```typescript
{
  type: 'yes_no' | 'choice' | 'next',
  block_id: number,  // 親ブロックID
  value: string      // トリガー値（'yes', 'no', choice値, または 'next'）
}
```

### 認証と認可

**プロバイダー**: Supabase Auth

**パターン**:
```typescript
// AuthContext でアプリ全体をラップ
<AuthProvider>
  <Router>...</Router>
</AuthProvider>

// コンポーネントで useAuth フックを使用
const { user, session, loading, signIn, signOut } = useAuth()

// 保護されたルート
useEffect(() => {
  if (!loading && !user) navigate('/login')
}, [user, loading])
```

**行レベルセキュリティ（RLS）**:
```sql
-- すべてのテーブルで使用されるパターン:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 公開読み取り（顧客向け）
CREATE POLICY "table_select" ON table_name
  FOR SELECT TO authenticated, anon USING (true);

-- 認証済みユーザーのみ変更可能
CREATE POLICY "table_insert" ON table_name
  FOR INSERT TO authenticated WITH CHECK (true);
```

**⚠️ 重要**: マイグレーション `005_*.sql` に RLS ポリシーが含まれています。これがないと管理機能が失敗します。

### 状態管理

**パターン**: React Context + ローカルステート（Redux/Zustand なし）

**AuthContext** (`/contexts/AuthContext.tsx`):
- アプリ全体でユーザーセッションを提供
- セッション変更時に自動更新
- サインイン/アウトを処理

**コンポーネントステート**:
- `useState`、`useEffect`、`useMemo`、`useCallback` を多用
- UI インタラクション用のローカルステート
- データ取得用のサービス層

---

## 開発ワークフロー

### ローカル開発

```bash
# フロントエンド（ポート 3000）
cd frontend
npm run dev

# バックエンド（ポート 5000）- オプション、ほとんどのロジックは Supabase に
cd backend
npm run dev
```

### 変更を加える

#### 1. 書く前に読む

**読んでいないコードの変更を提案しないでください。**

```bash
# 必ず最初にファイルを読む
# 良い: 読む → 理解する → 修正する
# 悪い: 推測する → 修正する
```

#### 2. サービスパターンに従う

すべての Supabase インタラクションはサービスファイルを経由:

```typescript
// services/formBuilderService.ts
export async function getFormSchemas(shopId: number): Promise<FormSchema[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order')

  if (error) throw error
  return data
}
```

**サービスはエラーをスローし、コンポーネントがキャッチ**:

```typescript
// コンポーネントでの使用
try {
  setLoading(true)
  const forms = await getFormSchemas(shopId)
  setForms(forms)
} catch (err) {
  console.error('Failed to load:', err)
  alert(`読み込み失敗: ${getErrorMessage(err)}`)
} finally {
  setLoading(false)
}
```

#### 3. エラーハンドリングパターン

**常に try-catch-finally を使用**:

```typescript
const handleSave = async () => {
  try {
    setLoading(true)
    await saveFormSchema(data)
    alert('保存しました')
    await reloadData()  // 成功後にリフレッシュ
  } catch (err) {
    console.error('Save failed:', err)
    alert(`保存に失敗: ${getErrorMessage(err)}`)
  } finally {
    setLoading(false)  // 必ずローディング状態をリセット
  }
}
```

#### 4. TypeScript 厳格モード

以下が有効:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `strict: true`

**型パターン**:
```typescript
// 判別可能な共用体
type BlockType = 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference'
type FormStatus = 'draft' | 'published'

// 結合データ用の拡張型
interface ProductCategoryWithItems extends ProductCategory {
  items: Item[]
}

// 柔軟な JSONB としてのメタデータ
metadata: {
  product_category_id?: number
  display_mode?: 'expanded' | 'collapsed'
  choice_options?: ChoiceOption[]
  [key: string]: any  // 拡張を許可
}
```

### Git ワークフロー

#### ブランチ戦略

```
main                                    # 本番環境
  └── claude/feature-name-sessionId     # Claude Code ブランチ
```

**ブランチ命名規則**:
- `claude/` で始める必要がある
- セッション ID で終わる必要がある
- 例: `claude/add-claude-documentation-PhdeZ`

#### コミットメッセージ

従来型コミットに従う:

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング（動作変更なし）
docs: ドキュメント更新
style: コードスタイル（フォーマット、ロジック変更なし）
test: テスト追加・修正
chore: ビルド・設定変更
debug: デバッグログ追加（本番前に削除）
```

**例**:
```bash
git commit -m "feat: フォームビルダーにchoiceブロックを追加"
git commit -m "fix: ブロック削除時の確認ダイアログ重複を修正"
git commit -m "docs: CLAUDE.mdにアーキテクチャ説明を追加"
```

#### 変更をコミット

**ユーザーから明示的に要求された場合のみコミット。**

```bash
# 1. ステータスと差分を確認
git status
git diff

# 2. 関連ファイルをステージング
git add <files>

# 3. 説明的なメッセージでコミット
git commit -m "$(cat <<'EOF'
feat: 機能の説明

必要に応じて追加のコンテキスト
EOF
)"

# 4. リモートにプッシュ
git push -u origin claude/branch-name-sessionId
```

**⚠️ 重要**:
- `claude/` で始まるブランチにのみプッシュ
- `git push -u origin <branch-name>` を使用
- ネットワークエラー時は指数バックオフで最大 4 回リトライ（2秒、4秒、8秒、16秒）
- `main` に直接プッシュしない

#### プルリクエストの作成

```bash
# 1. 変更がプッシュされていることを確認
git push -u origin claude/branch-name

# 2. gh CLI を使用して PR を作成
gh pr create --title "PR タイトル" --body "$(cat <<'EOF'
## 概要
- 変更 1
- 変更 2

## テスト計画
- [ ] ローカルでテスト済み
- [ ] ビルド成功
- [ ] コンソールエラーなし
EOF
)"
```

**自動マージ**: `claude/*` ブランチの PR は GitHub Actions によって自動的にマージされます。

### CI/CD パイプライン

#### deploy.yml - GitHub Pages デプロイ

**トリガー**:
- `main` へのプッシュ
- 手動ワークフロー実行

**ステップ**:
1. コードをチェックアウト
2. Node.js 18 をインストール
3. 複数テナント用にフロントエンドをビルド:
   - `npm run build:y_sogo` → `deploy/y_sogo/simulation/`
   - `npm run build:c_sogo` → `deploy/c_sogo/simulation/`
4. ルート `index.html` を作成
5. GitHub Pages にデプロイ

#### auto-merge.yml - Claude ブランチ自動マージ

**トリガー**: `claude/**` へのプッシュ

**機能**:
- PR を自動作成
- 指数バックオフでリトライロジック（4 回リトライ）
- マージ可能状態を待機（5 回試行 × 5秒）
- ブランチ削除付きで自動マージ

---

## 重要な規約

### ファイル命名

| 種類 | 規約 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `FormBuilderCanvas.tsx` |
| サービス | camelCase | `formBuilderService.ts` |
| 型 | camelCase | `formBuilder.ts` |
| ユーティリティ | camelCase | `errorReporter.ts` |
| データベーステーブル | snake_case | `form_schemas`, `product_categories` |
| データベースカラム | snake_case | `shop_id`, `created_at` |

### コード構成

#### サービス層パターン

各サービスは CRUD + ユーティリティ関数をエクスポート:

```typescript
// パターン: get*, create*, update*, delete*, <custom>*
export async function getFormSchemas(shopId: number): Promise<FormSchema[]>
export async function createFormSchema(data: CreateFormSchema): Promise<FormSchema>
export async function updateFormSchema(id: number, data: Partial<FormSchema>): Promise<FormSchema>
export async function deleteFormSchema(id: number): Promise<void>
export async function publishFormSchema(id: number): Promise<FormSchema>
```

#### コンポーネントパターン

```typescript
// 1. インポート
import { useState, useEffect } from 'react'
import { serviceFunction } from '../services/serviceName'

// 2. 型定義（必要に応じて）
interface Props {
  // ...
}

// 3. コンポーネント
export function ComponentName({ prop1, prop2 }: Props) {
  // 4. ステート
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState(false)

  // 5. エフェクト
  useEffect(() => {
    loadData()
  }, [])

  // 6. ハンドラー
  const handleAction = async () => {
    try {
      setLoading(true)
      await serviceFunction()
      alert('成功しました')
    } catch (err) {
      console.error('Error:', err)
      alert(`失敗: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // 7. レンダー
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### スタイリング規約

**Tailwind CSS** とカスタムデザインシステム:

```typescript
// tailwind.config.js のカスタムカラー
colors: {
  brand: { ... },      // 横浜そごう写真館 ブルー
  secondary: { ... },  // ゴールドアクセント
  accent: { ... },     // アクセントカラー
  neutral: { ... },    // グレースケール
  background: { ... }  // ソフトアイボリー
}

// 日本語フォント
fontFamily: {
  'mincho': ['"Yu Mincho"', ...],   // 日本語明朝体
  'gothic': ['"Yu Gothic"', ...]    // 日本語ゴシック体
}
```

**よくあるパターン**:
```jsx
// ボタン
<button className="btn-primary">主要アクション</button>
<button className="btn-secondary">副次アクション</button>

// カード
<div className="bg-white rounded-lg shadow-md p-6">
  {/* コンテンツ */}
</div>

// モバイルファーストレスポンシブ
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* レスポンシブ幅 */}
</div>
```

### 重要な開発ルール

#### ✅ すべきこと

- **編集前にファイルを読む** - 必ず Read ツールを最初に使用
- **モバイルファースト設計** - スマートフォンビューポートでテスト
- **プログレッシブディスクロージャー** - ブロックを段階的に表示
- **税込価格** - 税込価格のみ表示
- **エラー追跡** - 自動ログ記録のために `console.error()` を使用
- **TypeScript 厳格モード** - すべての型エラーを修正
- **サービス層** - すべての Supabase 呼び出しを抽象化
- **ローディング状態** - 常にローディング UI を管理
- **エラーメッセージ** - ユーザーフレンドリーな日本語メッセージ

#### ❌ してはいけないこと

- **税抜価格** - 税抜価格を表示しない
- **デスクトップファースト設計** - デスクトップを優先しない
- **本番環境のデバッグログ** - デプロイ前に削除
- **直接 Supabase 呼び出し** - サービス層を使用
- **ファイル内容を推測** - 必ず最初に読む
- **エラーハンドリングをスキップ** - 常に try-catch を使用
- **TypeScript エラーを無視** - コミット前にすべてのエラーを修正

---

## よくあるタスク

### 新しいブロックタイプを追加

**変更するファイル**:
1. `/types/formBuilder.ts` - `BlockType` 共用体に追加
2. `/components/admin/FormBuilderCanvas.tsx` - ツールバーボタンを追加
3. `/components/admin/FormBlockNode.tsx` - レンダリングを実装
4. `/components/admin/BlockEditModal.tsx` - 編集 UI を追加
5. `/pages/CustomerFormPageV3.tsx` - 顧客向けレンダリングを追加

**例**:
```typescript
// 1. types/formBuilder.ts
type BlockType = 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference' | 'new_type'

// 2. FormBuilderCanvas.tsx - ツールバーボタンを追加
<button onClick={() => addBlock('new_type', '新しいブロックコンテンツ')}>
  新タイプを追加
</button>

// 3. FormBlockNode.tsx - ノードビューでレンダリング
case 'new_type':
  return <div className="font-bold">{content}</div>

// 4. BlockEditModal.tsx - 編集フォームを追加
{block.block_type === 'new_type' && (
  <div>
    <label>特別フィールド</label>
    <input {...} />
  </div>
)}

// 5. CustomerFormPageV3.tsx - 顧客向けレンダリング
case 'new_type':
  return <div className="text-lg">{block.content}</div>
```

### データベースマイグレーションを追加

**手順**:
1. 新しいファイルを作成: `supabase/migrations/023_descriptive_name.sql`
2. SQL を記述:
```sql
-- 023_add_new_column.sql
ALTER TABLE form_schemas
ADD COLUMN new_column VARCHAR(255);

CREATE INDEX idx_form_schemas_new_column ON form_schemas(new_column);

-- ドキュメント用のコメントを追加
COMMENT ON COLUMN form_schemas.new_column IS 'カラムの説明';
```
3. 開発 Supabase プロジェクトでテスト（SQL エディタ）
4. マイグレーション README を更新: `supabase/migrations/README.md`
5. 本番 Supabase プロジェクトに適用

**⚠️ 重要**:
- マイグレーションは数値順に適用される
- 説明的な名前を使用
- 本番前にテスト
- マイグレーション詳細で README.md を更新

### 新しいサービス関数を追加

**パターン**:
```typescript
// services/formBuilderService.ts

/**
 * 撮影カテゴリでフォームスキーマを取得
 * @param shopId 店舗 ID
 * @param shootingCategoryId 撮影カテゴリ ID
 * @returns フォームスキーマの配列
 * @throws クエリ失敗時に Supabase エラー
 */
export async function getFormsByShootingCategory(
  shopId: number,
  shootingCategoryId: number
): Promise<FormSchema[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shooting_category_id', shootingCategoryId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}
```

**ベストプラクティス**:
- `@param`、`@returns`、`@throws` を含む JSDoc コメント
- 型付きパラメータと戻り値
- エラーをスロー（呼び出し側で処理）
- リストには null ではなく空配列を返す
- 単一レコードには `.single()` を使用、`PGRST116`（見つからない）エラーを処理

### エラーレポーターでデバッグ

**自動ログ記録**:
すべての `console.log/warn/error/debug` 呼び出しがインターセプトされ保存されます。

**手動ダウンロード**:
```javascript
// ブラウザコンソールで
window.errorReporter.getLogs()           // すべてのログを表示
window.errorReporter.downloadReport()    // JSON レポートをダウンロード
window.errorReporter.clearLogs()         // すべてのログをクリア
```

**自動レポート**:
`console.error()` が呼ばれると、レポートが自動生成されます。

**開発環境**:
エラーレポートがコンソールに表示（テーブル形式）。

**本番環境**:
エラーは `localStorage` に保存（最新 10 件）。

### テストを実行

```bash
cd frontend

# ウォッチモード
npm test

# UI モード（推奨）
npm run test:ui

# シングルラン
npm run test:run

# カバレッジ
npm run test:coverage
```

**テストファイル**:
- `/utils/formBuilderLogic.test.ts`
- `/utils/sectionLogic.test.ts`
- `/utils/conditionalRuleEngine.test.ts`
- `/services/formBuilderService.test.ts`

---

## 重要な注意点

### 1. マイグレーション 005 は重要

**症状**: 管理機能が権限エラーで失敗

**原因**: RLS ポリシーが適用されていない

**解決方法**:
```sql
-- Supabase SQL エディタで実行
-- ポリシーが存在するか確認:
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- 欠けている場合、マイグレーション 005 を適用
-- 以下のファイルの内容をコピー: supabase/migrations/005_*.sql
```

### 2. 下書き vs 公開の混同

**覚えておくこと**:
- 編集は `form_blocks`（下書き）のみ変更
- 顧客には `published_blocks`（別テーブル）が表示される
- 下書き → 公開にコピーするには「公開」をクリック

**ステータス確認**:
```sql
SELECT id, name, status, published_at FROM form_schemas;
```

### 3. 条件ブロックロジック

**プログレッシブディスクロージャー**:
`show_condition` を持つブロックは条件が満たされた場合のみ表示。

**例**:
```typescript
// ブロック 2 はブロック 1 の回答が "yes" の場合のみ表示
{
  block_type: 'text',
  content: '追加オプションを選択してください',
  show_condition: {
    type: 'yes_no',
    block_id: 1,
    value: 'yes'
  }
}
```

**注意**: 条件が真になると即座にブロックが表示される。すべてのパスをテスト。

### 4. マルチテナントデプロイ

**2 つの別々のビルド**:
- `npm run build:y_sogo` - 横浜そごう（VITE_SHOP_ID=1）
- `npm run build:c_sogo` - 千葉そごう（VITE_SHOP_ID=2）

**異なるベースパス**:
- `/y_sogo/simulation/`
- `/c_sogo/simulation/`

**GitHub Pages ルーティング**:
SPA ルーティングのために `404.html` リダイレクト + `sessionStorage` を使用。

### 5. 税込価格のみ

**常に**:
```
✅ 32,780円（税込）
✅ ¥32,780
```

**絶対に**:
```
❌ 29,800円（税抜）
❌ 32,780円（税込29,800円）
```

### 6. 自動マージのタイミング

**GitHub Actions 自動マージ**には 1-3 分かかります。

**ステータス確認**:
```bash
gh pr list --head claude/your-branch-name
gh run list --workflow=auto-merge.yml
```

**スタックした場合**:
- 5 分待つ
- GitHub Actions ログを確認
- リトライロジックが API エラーを処理（最大 4 回リトライ）

### 7. Supabase Service Role Key

**フロントエンドで公開しない**:
- Service role key は RLS をバイパス
- バックエンドでのみ使用
- フロントエンドは `anon` キーのみ使用

**チェック**:
```typescript
// ❌ 悪い - フロントエンドで
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ 良い - フロントエンドで
const supabase = createClient(url, ANON_KEY)

// ✅ 良い - バックエンドのみ
const supabase = createClient(url, SERVICE_ROLE_KEY)
```

---

## テスト・デプロイ

### ローカルテストチェックリスト

コミット前:
- [ ] `npm run build` が成功（TypeScript エラーなし）
- [ ] ブラウザでコンソールエラーなし
- [ ] モバイルビューポートでテスト（DevTools レスポンシブモード）
- [ ] すべての条件分岐をテスト（該当する場合）
- [ ] 料金計算が正確
- [ ] エラーハンドリングが動作（ネットワーク切断して再試行）

### ビルドプロセス

```bash
cd frontend

# 本番ビルド
npm run build

# マルチテナントビルド（GitHub Pages 用）
npm run build:y_sogo  # 横浜そごう
npm run build:c_sogo  # 千葉そごう

# ビルド出力を確認
ls -la dist/
```

### デプロイ

**自動**（GitHub Actions 経由）:
1. `claude/*` ブランチにプッシュ
2. `main` に自動マージ（`auto-merge.yml` 経由）
3. GitHub Pages に自動デプロイ（`deploy.yml` 経由）
4. 約 5 分でライブ

**手動**（必要な場合）:
```bash
# デプロイワークフローをトリガー
gh workflow run deploy.yml
```

**ライブ URL**:
- 横浜そごう: `https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/`
- 千葉そごう: `https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/c_sogo/simulation/`

### デプロイ確認

1. GitHub Actions を確認: `https://github.com/ykmp-dev/Photo-Studio-Pricing-Simulator/actions`
2. ライブ URL にアクセス
3. 認証をテスト（ログイン）
4. フォームビルダーをテスト（管理画面）
5. 顧客フォームをテスト（公開済みフォームのみ）

---

## 参考ドキュメント

### 主要ドキュメント

| ファイル | 目的 | いつ読むか |
|---------|------|-----------|
| **CLAUDE.md** | AI アシスタント向けガイド（このファイル） | 初回、大きな変更前 |
| **README.md** | ユーザー向けドキュメント | 機能理解 |
| **ARCHITECTURE.md** | 詳細アーキテクチャ | 設計の深堀り |
| **TROUBLESHOOTING.md** | よくある問題と解決方法 | 問題発生時 |
| **.claude/DEVELOPMENT_GUIDELINES.md** | 日本語開発ガイドライン | 規約理解 |
| **.claude/DEVELOPMENT_LOG.md** | 変更履歴 | 最近の変更キャッチアップ |

### クイックリファレンス

**よく使うコマンド**:
```bash
# 開発
npm run dev              # 開発サーバー起動
npm run build            # 本番ビルド
npm test                 # テスト実行

# Git
git log --oneline -10    # 最近のコミット
git status               # 現在の状態
git diff                 # ステージされていない変更

# GitHub CLI
gh pr list               # PR 一覧
gh pr create             # PR 作成
gh run list              # ワークフロー実行一覧
```

**便利なパス**:
```
/frontend/src/services/         # すべての Supabase インタラクション
/frontend/src/types/            # TypeScript 定義
/frontend/src/components/admin/ # 管理コンポーネント
/frontend/src/pages/            # ページコンポーネント
/supabase/migrations/           # データベーススキーマ
```

**理解すべき重要ファイル**:
1. `/frontend/src/pages/FormNodeViewPage.tsx` - フォームビルダー UI
2. `/frontend/src/components/admin/FormBuilderCanvas.tsx` - ビジュアルエディタ
3. `/frontend/src/services/formBuilderService.ts` - フォーム操作
4. `/frontend/src/pages/CustomerFormPageV3.tsx` - 顧客向けフォーム
5. `/frontend/src/utils/errorReporter.ts` - エラー追跡

### 外部リソース

- **Supabase ドキュメント**: https://supabase.com/docs
- **React Flow ドキュメント**: https://reactflow.dev/docs
- **Vite ドキュメント**: https://vitejs.dev/guide
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript ハンドブック**: https://www.typescriptlang.org/docs

### ヘルプを得る

**トラブルシューティングワークフロー**:
1. `TROUBLESHOOTING.md` を確認
2. エラーレポートをダウンロード: `window.errorReporter.downloadReport()`
3. DB 問題は Supabase ダッシュボード → SQL エディタを確認
4. デプロイ問題は GitHub Actions ログを確認
5. マイグレーション状態を確認: `scripts/diagnose.sql`

**ヘルプを求める前に**:
- [ ] 関連ドキュメントを読む
- [ ] 最近のコミットを確認（`git log`）
- [ ] 環境変数を確認
- [ ] クリーンなブラウザでテスト（シークレットモード）
- [ ] RLS 問題は Supabase ダッシュボードを確認

---

## まとめ: 新しい Claude セッション向けクイックオリエンテーション

### 最初の 5 分

1. **このファイルを読む**（CLAUDE.md）
2. **最近の履歴を確認**: `git log --oneline -20`
3. **開発ログを読む**: `.claude/DEVELOPMENT_LOG.md`
4. **ビルドを確認**: `cd frontend && npm run build`
5. **現在のブランチを確認**: `git status`

### 覚えておくべき重要事項

1. **書く前に必ず読む** - 最初に Read ツールを使用
2. **サービス層パターン** - すべての Supabase → services/*.ts
3. **エラーハンドリング** - 常に try-catch-finally
4. **モバイルファースト** - レスポンシブデザインをテスト
5. **税込のみ** - 税抜価格を表示しない
6. **下書き/公開** - 編集 ≠ 公開
7. **RLS ポリシーが重要** - マイグレーション 005 を適用必須
8. **型安全性** - すべての TypeScript エラーを修正
9. **要求された場合のみコミット** - 積極的にならない
10. **Claude ブランチのみ** - main に直接プッシュしない

### よくある落とし穴

1. **編集前にファイルを読まない**
2. **非同期関数でエラーハンドリングをスキップ**
3. **モバイルビューポートをテストしない**
4. **税抜価格を表示**
5. **サービスを使わず直接 Supabase 呼び出し**
6. **確認せずにマイグレーション状態を仮定**
7. **既存パターンを理解せずに編集**

### あなたの役割

あなたは**ソフトウェアエンジニアリングタスク**を支援する AI アシスタントです:
- 要求された機能を実装
- バグを体系的に修正
- 要求されたコードをリファクタリング
- コードの動作を説明
- トラブルシューティングを支援

**すべきでないこと**:
- 求められていない改善を行う
- 要求されていない機能を追加
- 過剰にエンジニアリング
- ユーザーの規約を無視
- 既存コードより優れていると思い込む

---

**最終更新**: 2025-12-26
**バージョン**: 1.0.0
**メンテナンス**: Claude Code セッション

質問や更新がある場合は、このファイルを変更して以下のようにコミット:
```bash
git commit -m "docs: CLAUDE.mdを更新 - [説明]"
```
