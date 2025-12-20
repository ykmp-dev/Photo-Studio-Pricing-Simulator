# 🚀 セッション開始ガイド

新しいClaude Codeセッションを開始する際は、このファイルを最初に読んでください。

## 📌 最初に必ず読むべきファイル（優先順）

1. **このファイル** - `.claude/SESSION_START.md`（今読んでいるファイル）
2. **開発ガイドライン** - `.claude/DEVELOPMENT_GUIDELINES.md`
3. **開発ログ** - `.claude/DEVELOPMENT_LOG.md`
4. **引き継ぎドキュメント** - `HANDOFF.md`（存在する場合）

## ⚡ クイックチェックリスト

セッション開始時に以下を順番に実行してください:

```bash
# 1. 現在のブランチを確認
git branch --show-current

# 2. 最新のコミットを確認（最近の作業内容）
git log --oneline -10

# 3. 作業ディレクトリの状態を確認
git status

# 4. ビルドが通るか確認
cd frontend && npm run build

# 5. デプロイサイトで現在の動作を確認
# https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/
```

## 🎯 プロジェクト概要

**写真館向け料金シミュレーター & フォームビルダー**

- **顧客向け**: プログレッシブディスクロージャー型の料金シミュレーター
- **管理者向け**: ノーコードフォームビルダー（ノードビューUI）
- **技術スタック**: React + TypeScript + Supabase + Vite

## 📋 重要な開発方針（必読）

### 1. スマホ優先（モバイルファースト）
- すべてのUIはスマホでの表示を最優先
- レスポンシブデザインを徹底

### 2. プログレッシブディスクロージャー
- ユーザーが前の質問に答えるまで次のブロックを表示しない
- フォームは段階的に展開される

### 3. 税込価格のみ表示
- すべての料金は**税込価格のみ**を表示
- 「29,800円（税込）」のような表記

### 4. デバッグログ
- **開発中はOK、本番デプロイ前に必ず削除**
- `console.log()`, `console.warn()`, `console.error()` は本番では削除

## 🗂️ プロジェクト構造

```
Photo-Studio-Pricing-Simulator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SimulatorNew.tsx       # 料金シミュレーター（顧客向け）
│   │   │   └── admin/
│   │   │       ├── FormManager.tsx           # フォームビルダー管理
│   │   │       ├── FormBuilderCanvas.tsx     # ノードビューUI
│   │   │       ├── BlockEditModal.tsx        # ブロック編集モーダル
│   │   │       └── CategoryManager.tsx       # カテゴリ管理
│   │   ├── services/
│   │   │   ├── formBuilderService.ts  # フォーム関連API
│   │   │   ├── categoryService.ts     # カテゴリ関連API
│   │   │   └── simulatorService.ts    # シミュレーター用API
│   │   └── types/
│   │       ├── formBuilder.ts         # フォーム型定義
│   │       └── category.ts            # カテゴリ型定義
├── supabase/
│   └── migrations/                    # DBマイグレーション
├── data_import/                       # CSVインポート用サンプルデータ
│   ├── README.md
│   ├── shooting_categories.csv        # 撮影カテゴリ（8件）
│   ├── product_categories.csv         # 商品カテゴリ（10件）
│   └── items.csv                      # アイテム（68件）
└── .claude/
    ├── SESSION_START.md               # このファイル
    ├── DEVELOPMENT_GUIDELINES.md      # 開発ガイドライン
    └── DEVELOPMENT_LOG.md             # 開発ログ
```

## 🔑 データ構造（重要）

### カテゴリ階層

```
ShootingCategory（撮影カテゴリ）
  例: 七五三、成人式、お宮参り

ProductCategory（商品カテゴリ）
  例: メイク、ヘアセット、アルバム、衣装

Item（アイテム）
  例: フルメイク 5,500円、ヘアセット 4,400円
```

**⚠️ 重要**: `shooting_product_associations` テーブルは削除済み。撮影カテゴリと商品カテゴリの直接の紐付けは使用しない。

### フォームブロックタイプ

```
FormBlock
  ├─ text: テキスト表示
  ├─ heading: 見出し
  ├─ yes_no: Yes/No質問（2択）
  ├─ choice: 選択肢質問（多択）
  └─ category_reference: 商品カテゴリ参照

ShowCondition（条件分岐）
  ├─ type: 'yes_no' | 'choice'
  ├─ block_id: 参照するブロックのID
  └─ value: 期待する回答値
```

## 🚫 やってはいけないこと

- ❌ 税抜価格の表示
- ❌ デスクトップ優先のデザイン
- ❌ 本番環境にデバッグログを残す
- ❌ `shooting_product_associations` テーブルを使う
- ❌ フォームブロックの順序を無視した表示

## ✅ 必ずやること

- ✅ スマホでの動作確認
- ✅ プログレッシブディスクロージャーの動作確認
- ✅ 条件分岐の動作確認
- ✅ 価格計算の正確性確認
- ✅ デプロイ前にデバッグログ削除

## 🌿 ブランチ戦略

```
main                         # 本番環境
  └─ claude/feature-name-*   # Claude Codeの作業ブランチ
```

- ブランチ名は必ず `claude/` で始める
- セッションIDを含める: `claude/choice-block-01BmvtLhyedN4MCeLRHfWDFK`

## 📝 コミット規約

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
style: コードスタイル修正（機能変更なし）
test: テスト追加・修正
chore: ビルド・設定変更
```

## 🔄 GitHub Actions

### Auto-Merge Workflow
`claude/**` ブランチへのpushで自動的にPR作成 → mainへマージ → GitHub Pagesデプロイ

**タイムアウト対策実装済み**:
- GitHub API接続の自動リトライ（最大3回）
- 指数バックオフ（5秒→10秒→20秒）

## 🆘 トラブルシューティング

### ビルドエラーが出る場合
```bash
# 依存関係の再インストール
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ローカルで動作確認したい場合
```bash
cd frontend
npm run dev
# http://localhost:5173 で確認
```

### データベースマイグレーションを適用したい場合
```bash
# Supabase CLIを使用
supabase db reset
# または個別に適用
supabase migration up
```

## 🌐 デプロイ先

- **本番サイト**: https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/
- **リポジトリ**: https://github.com/ykmp-dev/Photo-Studio-Pricing-Simulator

## 🤝 複数セッション開発について

このプロジェクトは**複数のClaude Codeセッション**で同時開発されています。

### 作業前の確認
1. `git pull` で最新の変更を取得
2. コンフリクトがないか確認
3. 他のセッションの作業内容を `DEVELOPMENT_LOG.md` で確認

### 作業後
1. `DEVELOPMENT_LOG.md` に作業内容を記録
2. 重要な設計変更は `DEVELOPMENT_GUIDELINES.md` に反映
3. 次のセッションへの引き継ぎ事項があれば `HANDOFF.md` を作成

## 📚 参考情報

### 参考サイト
- **らかんスタジオ**: ドロップダウン方式の料金シミュレーター
- **横浜そごう写真館**: 3択プラン → 詳細分岐の料金体系

### 技術ドキュメント
- React Flow: https://reactflow.dev/
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

## 🎬 セッション開始時のアクション

セッションを開始したら、以下の順で作業してください:

1. ✅ このファイルを読んだ
2. ✅ `DEVELOPMENT_GUIDELINES.md` を読んだ
3. ✅ `git log --oneline -10` で最近のコミットを確認した
4. ✅ `git status` で作業状態を確認した
5. ✅ `HANDOFF.md` があれば読んだ（引き継ぎ事項の確認）
6. ✅ ビルドが通ることを確認した

**これで準備完了です！良いコーディングを！🚀**

---

**最終更新**: 2025-12-20
**更新者**: Claude Code (Session: 01BmvtLhyedN4MCeLRHfWDFK)
