# 写真館向け料金シミュレーター

非エンジニアでも簡単に更新できる、写真館向けの料金シミュレーション機能付きランディングページと管理画面です。

## 📋 機能概要

### ユーザー向けシミュレーター
- 撮影メニュー・プラン選択
- オプション複数選択
- リアルタイム料金計算（税込・税抜表示）
- キャンペーン割引の自動適用
- レスポンシブデザイン対応

### 管理画面
- フォームビルダー（ノードビュー/リストビュー）
- カテゴリ管理（撮影カテゴリ・商品カテゴリ・アイテム）
- ドラッグ＆ドロップによる条件分岐設定
- プレビュー機能
- 保存/更新機能（draft/published分離）
- Supabase Authによる認証
- 店舗別データ管理（RLS対応）

### 開発者向け機能
- **自動ログ収集**: すべてのconsoleログを自動収集（errorReporter）
- **GitHub Actions**: 自動デプロイ＆auto-merge（リトライロジック付き）
- **診断ツール**: データベース状態確認スクリプト
- **E2Eテスト**: Playwright環境セットアップスクリプト

## 🏗️ 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite + Tailwind CSS + React Flow
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **CI/CD**: GitHub Actions（自動デプロイ＆auto-merge）
- **ホスティング**: GitHub Pages
- **テスト**: Playwright（E2E）
- **監視**: errorReporter（自動ログ収集）

## 📁 プロジェクト構造

```
Photo-Studio-Pricing-Simulator/
├── frontend/                          # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                # 管理画面コンポーネント
│   │   │   │   ├── FormNodeViewPage.tsx  # ノードビュー
│   │   │   │   ├── FormManager.tsx       # フォーム管理
│   │   │   │   └── CategoryManager.tsx   # カテゴリ管理
│   │   │   └── SimulatorNew.tsx      # 顧客向けシミュレーター
│   │   ├── pages/                    # ページコンポーネント
│   │   ├── services/                 # API通信サービス
│   │   ├── utils/
│   │   │   ├── logger.ts             # ログ出力ユーティリティ
│   │   │   └── errorReporter.ts      # 自動ログ収集システム
│   │   ├── types/                    # TypeScript型定義
│   │   └── lib/                      # Supabaseクライアント
│   └── package.json
│
├── supabase/                         # データベース
│   └── migrations/                   # マイグレーションスクリプト
│       ├── 015_create_published_blocks.sql
│       └── 016_create_save_form_blocks_function.sql
│
├── scripts/                          # 開発支援スクリプト
│   ├── diagnose.sql                  # データベース診断
│   └── setup-e2e-tests.sh            # E2Eテスト環境セットアップ
│
├── .github/workflows/                # GitHub Actions
│   ├── deploy.yml                    # 自動デプロイ
│   └── auto-merge.yml                # PR自動マージ
│
├── .claude/                          # 開発ドキュメント
│   ├── DEVELOPMENT_GUIDELINES.md     # 開発ガイドライン
│   └── DEVELOPMENT_LOG.md            # 開発ログ
│
├── TROUBLESHOOTING.md                # トラブルシューティング
├── TEST_SCENARIO.md                  # テストシナリオ
└── README.md                         # このファイル
```

## 🚀 セットアップ手順

### 1. 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editorで以下のファイルを順番に実行：
   ```bash
   database/schema.sql
   database/rls_policies.sql
   database/sample_data.sql  # オプション: サンプルデータ
   ```

3. Settings > API から以下の情報を取得：
   - Project URL
   - anon/public key
   - service_role key

### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install

# 環境変数の設定
cp .env.example .env.local
```

`.env.local` を編集：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
VITE_DEFAULT_SHOP_ID=1
```

開発サーバーを起動：
```bash
npm run dev
```

本番ビルド：
```bash
npm run build
```

### 4. バックエンドのセットアップ

```bash
cd backend
npm install

# 環境変数の設定
cp .env.example .env
```

`.env` を編集：
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

開発サーバーを起動：
```bash
npm run dev
```

本番ビルドと起動：
```bash
npm run build
npm start
```

## 🔐 初回ユーザー作成

Supabaseダッシュボードで管理者ユーザーを作成：

1. Authentication > Users > Add User
2. メールアドレスとパスワードを入力
3. `shops` テーブルで `owner_email` を作成したユーザーのメールアドレスに設定

```sql
INSERT INTO shops (name, owner_email) VALUES
('あなたの写真館名', 'admin@example.com');
```

## 📊 データベーススキーマ

### テーブル一覧

- `shops` - 店舗情報
- `plans` - 撮影プラン
- `options` - オプションアイテム
- `campaigns` - キャンペーン
- `campaign_plan_associations` - キャンペーンとプランの関連

詳細は `database/schema.sql` を参照してください。

## 🌐 API エンドポイント

### 公開API

- `GET /api/simulator?shop=:shopId` - シミュレーターデータ取得

### 管理API（認証必要）

**プラン管理**
- `GET /api/admin/plans?shop=:shopId`
- `POST /api/admin/plans`
- `PUT /api/admin/plans/:id`
- `DELETE /api/admin/plans/:id`

**オプション管理**
- `GET /api/admin/options?shop=:shopId`
- `POST /api/admin/options`
- `PUT /api/admin/options/:id`
- `DELETE /api/admin/options/:id`

**キャンペーン管理**
- `GET /api/admin/campaigns?shop=:shopId`
- `POST /api/admin/campaigns`
- `PUT /api/admin/campaigns/:id`
- `DELETE /api/admin/campaigns/:id`

## 🎨 カスタマイズ

### カラーテーマの変更

`frontend/tailwind.config.js` のprimaryカラーを編集：

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        // ...
        600: '#0284c7',  // メインカラー
        // ...
      }
    }
  }
}
```

### 予約ボタンのリンク先変更

`frontend/src/components/Simulator.tsx` の「予約はこちら」ボタンを編集：

```tsx
<button
  className="btn-primary"
  onClick={() => window.location.href = 'https://your-booking-url.com'}
>
  予約はこちら
</button>
```

## 🚢 デプロイ

### フロントエンド（Vercel / Netlify）

1. GitHubリポジトリにプッシュ
2. Vercel/Netlifyでプロジェクトをインポート
3. 環境変数を設定
4. デプロイ

### バックエンド（Xサーバー）

詳細は `DEPLOYMENT.md` を参照してください。

## 📝 ライセンス

MIT License


## ⚠️ 注意事項

- Supabase RLSポリシーが有効になっていることを確認してください
- 本番環境では必ず環境変数を適切に設定してください
- service_role keyは絶対にクライアント側に公開しないでください

## 🐛 トラブルシューティング

問題が発生した場合は、まず [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を確認してください。

### よくある問題

#### ブロックの追加ができない / 更新が反映されない

最も可能性が高い原因は**マイグレーションが未適用**です。

1. Supabaseダッシュボード → SQL Editor
2. `scripts/diagnose.sql` を実行して診断
3. 必要に応じてマイグレーション015, 016を適用

詳細: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

#### エラーログの確認

すべてのコンソールログは自動的に収集されています：

```javascript
// ブラウザのコンソールで実行
window.errorReporter.getLogs()           // ログ一覧を表示
window.errorReporter.downloadReport()    // JSONでダウンロード
```

詳細: [TROUBLESHOOTING.md - エラー追跡システム](./TROUBLESHOOTING.md#-自動エラー追跡システム-errorreporter)

## 📚 ドキュメント

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシューティングガイド
- [TEST_SCENARIO.md](./TEST_SCENARIO.md) - テストシナリオ
- [.claude/DEVELOPMENT_GUIDELINES.md](./.claude/DEVELOPMENT_GUIDELINES.md) - 開発ガイドライン
- [.claude/DEVELOPMENT_LOG.md](./.claude/DEVELOPMENT_LOG.md) - 開発ログ

## 📮 サポート

問題が発生した場合：

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を確認
2. `window.errorReporter.downloadReport()` でエラーレポートをダウンロード
3. GitHubのIssuesで報告（エラーレポートを添付）
