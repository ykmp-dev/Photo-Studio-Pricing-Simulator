# Supabase セットアップガイド

このガイドでは、写真館料金シミュレーターのSupabaseセットアップ手順を説明します。

## ステップ1: Supabaseアカウント作成

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでサインアップ（推奨）または、メールアドレスでサインアップ

## ステップ2: 新規プロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力:
   - **Name**: `photo-studio-pricing` (任意の名前)
   - **Database Password**: 強力なパスワードを生成（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択（日本から最速）
   - **Pricing Plan**: Free（無料プラン）でOK
3. 「Create new project」をクリック
4. プロジェクトの準備に1〜2分かかります

## ステップ3: データベーススキーマを作成

1. 左サイドバーの「SQL Editor」をクリック
2. 「New query」をクリック
3. `database/schema.sql` の内容をコピー＆ペースト

```sql
-- database/schema.sql の内容をそのまま実行
```

4. 「Run」ボタンをクリックして実行
5. 成功メッセージが表示されることを確認

## ステップ4: Row Level Security (RLS) ポリシーを設定

1. SQL Editorで新しいクエリを作成
2. `database/rls_policies.sql` の内容をコピー＆ペースト

```sql
-- database/rls_policies.sql の内容をそのまま実行
```

3. 「Run」ボタンをクリックして実行

## ステップ5: サンプルデータを挿入（オプション）

テスト用のサンプルデータを挿入する場合:

1. SQL Editorで新しいクエリを作成
2. `database/sample_data.sql` の内容をコピー＆ペースト
3. 「Run」ボタンをクリックして実行

## ステップ6: API認証情報を取得

1. 左サイドバーの「Settings」→「API」をクリック
2. 以下の情報をコピーしてメモ:
   - **Project URL**: `https://xxxxx.supabase.co` の形式
   - **anon public**: `eyJhbGciOiJIUzI1NiIs...` の形式（長いトークン）

## ステップ7: 認証設定

1. 左サイドバーの「Authentication」→「Providers」をクリック
2. 「Email」プロバイダーが有効になっていることを確認
3. 「Enable Email Confirmations」を**オフ**にする（開発用）
   - 本番環境では**オン**推奨

## ステップ8: 管理者ユーザーを作成

1. 左サイドバーの「Authentication」→「Users」をクリック
2. 「Add user」→「Create new user」をクリック
3. 以下を入力:
   - **Email**: 管理者用メールアドレス（例: `admin@yourstudio.jp`）
   - **Password**: 管理者用パスワード
   - **Auto Confirm User**: チェックを入れる
4. 「Create user」をクリック

## ステップ9: 店舗データを作成

管理者ユーザーが使用する店舗データを作成します:

1. SQL Editorで以下を実行:

```sql
-- 店舗データを挿入
INSERT INTO shops (name, slug, settings)
VALUES (
  'あなたの写真館',
  'your-studio',
  '{"tax_rate": 0.1, "currency": "JPY"}'::jsonb
);

-- 作成された shop_id を確認
SELECT id, name FROM shops;
```

2. 表示された `id` をメモしておく（例: `1`）

## ステップ10: フロントエンドの環境変数を設定

フロントエンド用の `.env` ファイルを作成:

```bash
# frontend/.env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SHOP_ID=1
```

> **重要**: `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません

## ステップ11: 動作確認

### ローカルで確認

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いて:

1. ✅ シミュレーターページが表示される
2. ✅ プランとオプションが読み込まれる（サンプルデータを入れた場合）
3. ✅ `/login` で管理画面にログインできる
4. ✅ プラン・オプション・キャンペーンの作成・編集・削除ができる

### トラブルシューティング

#### エラー: "Invalid API key"
- `VITE_SUPABASE_ANON_KEY` が正しいか確認
- キーの前後にスペースが入っていないか確認

#### エラー: "Failed to fetch"
- `VITE_SUPABASE_URL` が正しいか確認
- SupabaseプロジェクトのURL（Settings → API）と一致しているか確認

#### データが表示されない
- `VITE_SHOP_ID` が正しいか確認
- SQL Editorで `SELECT * FROM plans WHERE shop_id = 1;` を実行してデータがあるか確認

#### ログインできない
- 作成したユーザーのメールアドレス・パスワードが正しいか確認
- Authentication → Users でユーザーが作成されているか確認
- 「Email Confirmed」が `true` になっているか確認

## 次のステップ

### 本番環境への移行

1. **メール確認を有効化**:
   - Authentication → Providers → Email → Enable Email Confirmations をオン
   - SMTP設定（SendGrid、Resendなど）を追加

2. **RLSポリシーの確認**:
   - 各ユーザーが自分の店舗データのみアクセスできることを確認

3. **パフォーマンス最適化**:
   - Database → Indexes でインデックスを確認
   - 必要に応じて `shop_id` にインデックスを追加

### セキュリティ強化

1. **環境変数の管理**:
   - GitHub Secretsに環境変数を保存
   - Vercel/Netlifyの環境変数設定を使用

2. **CORS設定**:
   - Supabase Dashboard → Settings → API → CORS で許可するドメインを設定

3. **Rate Limiting**:
   - 必要に応じてSupabase EdgeFunctionsでレート制限を実装

## まとめ

これで基本的なSupabaseセットアップは完了です！

次は：
- GitHub Pagesでフロントエンドを公開
- 管理画面から実際のプラン・オプションデータを登録
- デザインのカスタマイズ
