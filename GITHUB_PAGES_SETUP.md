# GitHub Pages デプロイガイド

写真館料金シミュレーターをGitHub Pagesで公開する手順を説明します。

## 前提条件

- ✅ Supabaseのセットアップが完了していること（[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)参照）
- ✅ GitHubリポジトリが作成されていること
- ✅ Supabaseの認証情報（URL、Anon Key、Shop ID）を持っていること

## ステップ1: GitHub Secretsの設定

1. GitHubリポジトリページにアクセス
2. 「Settings」タブをクリック
3. 左サイドバーの「Secrets and variables」→「Actions」をクリック
4. 「New repository secret」をクリックして、以下の3つのシークレットを追加:

### シークレット1: VITE_SUPABASE_URL

- **Name**: `VITE_SUPABASE_URL`
- **Secret**: SupabaseプロジェクトのURL（例: `https://xxxxx.supabase.co`）
- 取得方法: Supabase Dashboard → Settings → API → Project URL

### シークレット2: VITE_SUPABASE_ANON_KEY

- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Secret**: Supabaseのanon publicキー（長いトークン）
- 取得方法: Supabase Dashboard → Settings → API → Project API keys → anon public

### シークレット3: VITE_SHOP_ID

- **Name**: `VITE_SHOP_ID`
- **Secret**: 店舗ID（例: `1`）
- 取得方法: Supabase SQL Editorで `SELECT id FROM shops;` を実行

## ステップ2: GitHub Pages の有効化

1. GitHubリポジトリの「Settings」タブ
2. 左サイドバーの「Pages」をクリック
3. 「Source」セクションで:
   - **Source**: `GitHub Actions` を選択
4. 保存（自動保存されます）

## ステップ3: コードをmainブランチにプッシュ

現在のブランチ（claude/photo-pricing-simulator-01BmvtLhyedN4MCeLRHfWDFK）から
mainブランチにマージしてプッシュします:

### 方法1: GitHubのWeb UIでプルリクエストを作成

1. GitHubリポジトリページにアクセス
2. 「Pull requests」タブをクリック
3. 「New pull request」をクリック
4. **base**: `main` ← **compare**: `claude/photo-pricing-simulator-01BmvtLhyedN4MCeLRHfWDFK`
5. 「Create pull request」をクリック
6. タイトルと説明を入力して「Create pull request」
7. 「Merge pull request」→「Confirm merge」をクリック

### 方法2: コマンドラインでマージ

```bash
# mainブランチに切り替え
git checkout main

# mainブランチを最新化
git pull origin main

# 作業ブランチをマージ
git merge claude/photo-pricing-simulator-01BmvtLhyedN4MCeLRHfWDFK

# mainにプッシュ
git push origin main
```

## ステップ4: デプロイの確認

1. GitHubリポジトリの「Actions」タブをクリック
2. 「Deploy to GitHub Pages」ワークフローが実行されていることを確認
3. ✅ 緑色のチェックマークが表示されたら成功
4. ❌ 赤色の×マークが表示されたら、ログを確認してエラーを修正

### デプロイにかかる時間

初回デプロイ: **約3〜5分**

## ステップ5: サイトにアクセス

デプロイが完了したら、以下のURLでアクセスできます:

```
https://[あなたのGitHubユーザー名].github.io/Photo-Studio-Pricing-Simulator/
```

例:
- ユーザー名が `ykmp-dev` の場合:
  ```
  https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/
  ```

## トラブルシューティング

### 問題: 404 Page Not Found

**原因**: GitHub Pagesが有効化されていない、またはデプロイに失敗

**解決策**:
1. Settings → Pages で「GitHub Actions」が選択されているか確認
2. Actions タブでデプロイが成功しているか確認
3. 5分ほど待ってから再度アクセス

### 問題: サイトは表示されるが、データが読み込まれない

**原因**: Supabaseの環境変数が正しく設定されていない

**解決策**:
1. Settings → Secrets and variables → Actions で3つのシークレットが正しく設定されているか確認
2. シークレットの値に余分なスペースや改行が含まれていないか確認
3. Supabaseのanon keyが正しいか確認（Supabase Dashboard → Settings → API）

### 問題: ビルドエラーが発生

**原因**: 依存関係のインストールまたはビルドに失敗

**解決策**:
1. ローカルで `cd frontend && npm run build` を実行してエラーを確認
2. `package-lock.json` が最新か確認
3. Actions のログを確認してエラー内容を特定

### 問題: CORSエラーが発生

**原因**: SupabaseのCORS設定が正しくない

**解決策**:
1. Supabase Dashboard → Settings → API → CORS Allowed Origins
2. `https://ykmp-dev.github.io` を追加（あなたのGitHub Pagesドメイン）

## カスタムドメインの設定（オプション）

独自ドメインを使用する場合:

1. Settings → Pages → Custom domain
2. ドメインを入力（例: `simulator.yourstudio.jp`）
3. DNSプロバイダーでCNAMEレコードを設定:
   ```
   CNAME: simulator.yourstudio.jp → ykmp-dev.github.io
   ```
4. 「Enforce HTTPS」をチェック

## 更新の反映

コードを更新した場合:

1. 変更をコミット・プッシュ
   ```bash
   git add .
   git commit -m "更新内容"
   git push origin main
   ```

2. GitHub Actionsが自動的にデプロイを開始
3. 約3〜5分で反映

## 本番運用のベストプラクティス

### 1. ブランチ保護

mainブランチを保護して、レビュー無しのマージを防止:
- Settings → Branches → Add branch protection rule
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1

### 2. ステージング環境

開発用のブランチ（develop）を作成して、ステージング環境を構築:
- `develop` ブランチを作成
- 別のGitHub Actionsワークフローで異なるSupabaseプロジェクトにデプロイ

### 3. 環境変数の管理

本番環境とステージング環境で異なるSupabaseプロジェクトを使用:
- 本番: `VITE_SUPABASE_URL_PROD`
- ステージング: `VITE_SUPABASE_URL_STAGING`

### 4. パフォーマンス監視

Google Analyticsやその他の分析ツールを導入:
```html
<!-- frontend/index.html に追加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
```

## まとめ

これで写真館料金シミュレーターがGitHub Pagesで公開されました！

次のステップ:
- 🎨 デザインのカスタマイズ
- 📊 管理画面からデータを登録
- 🔒 セキュリティ設定の強化
- 📱 モバイル表示の確認
- 🚀 パフォーマンスの最適化

ご不明な点があれば、お気軽にお問い合わせください！
