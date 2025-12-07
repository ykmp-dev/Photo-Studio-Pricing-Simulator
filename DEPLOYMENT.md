# デプロイメント手順書

## 🎯 本番環境デプロイガイド

このドキュメントでは、Xサーバーへの本番環境デプロイ手順を説明します。

## 📋 目次

1. [事前準備](#事前準備)
2. [Xサーバーの設定](#xサーバーの設定)
3. [フロントエンドのデプロイ](#フロントエンドのデプロイ)
4. [バックエンドのデプロイ](#バックエンドのデプロイ)
5. [トラブルシューティング](#トラブルシューティング)

---

## 事前準備

### 必要なもの

- Xサーバーアカウント（スタンダードプラン以上推奨）
- SSH接続情報（ホスト、ユーザー名、パスワード）
- ドメイン名（例: yourphoto.com）
- Supabaseプロジェクト（本番用）

### Xサーバー要件確認

1. サーバーパネルにログイン
2. Node.js対応を確認（サーバー情報 > Node.jsバージョン）
3. 必要に応じてNode.js 18以上を有効化

---

## Xサーバーの設定

### 1. SSH接続

```bash
ssh your-username@your-server.xsrv.jp
```

### 2. Node.jsバージョン確認

```bash
node -v  # v18以上推奨
npm -v
```

バージョンが古い場合、Xサーバーパネルから設定変更してください。

### 3. ディレクトリ構造作成

```bash
cd ~/your-domain.com
mkdir -p app/{frontend,backend}
```

---

## フロントエンドのデプロイ

### オプション1: Xサーバーで静的ホスティング

#### ローカルでビルド

```bash
cd frontend
npm install
npm run build
```

#### Xサーバーにアップロード

```bash
# SCPでアップロード
scp -r dist/* your-username@your-server.xsrv.jp:~/your-domain.com/public_html/
```

#### または、FTPクライアント（FileZilla等）を使用

1. `frontend/dist/` の内容を `public_html/` にアップロード

### オプション2: Vercel / Netlify（推奨）

#### Vercelの場合

1. Vercelアカウントでリポジトリをインポート
2. プロジェクト設定：
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. 環境変数を設定：
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=https://api.yourphoto.com/api
   VITE_DEFAULT_SHOP_ID=1
   ```

4. デプロイ

#### Netlifyの場合

1. Netlifyアカウントでリポジトリをインポート
2. ビルド設定：
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

3. 環境変数を同様に設定
4. デプロイ

---

## バックエンドのデプロイ

### 1. ソースコードのアップロード

#### Gitを使用する場合

```bash
cd ~/your-domain.com/app/backend
git clone https://github.com/your-repo/Photo-Studio-Pricing-Simulator.git .
cd backend
npm install
```

#### または、SCPでアップロード

```bash
# ローカル
cd backend
npm install --production
npm run build

# アップロード
scp -r dist package.json package-lock.json node_modules \
  your-username@your-server.xsrv.jp:~/your-domain.com/app/backend/
```

### 2. 環境変数の設定

```bash
cd ~/your-domain.com/app/backend
nano .env
```

`.env` ファイルを作成：

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
FRONTEND_URL=https://yourphoto.com
NODE_ENV=production
```

### 3. PM2で常駐化

#### PM2のインストール

```bash
npm install -g pm2
```

#### アプリケーション起動

```bash
cd ~/your-domain.com/app/backend
pm2 start dist/server.js --name photo-simulator
pm2 save
pm2 startup  # 起動スクリプト作成（表示されたコマンドを実行）
```

#### PM2コマンド一覧

```bash
pm2 status              # 状態確認
pm2 logs photo-simulator  # ログ確認
pm2 restart photo-simulator  # 再起動
pm2 stop photo-simulator     # 停止
pm2 delete photo-simulator   # 削除
```

### 4. Nginxリバースプロキシ設定（オプション）

Xサーバーでカスタムドメインを使用する場合：

```nginx
# /etc/nginx/conf.d/your-domain.conf

server {
    listen 80;
    server_name api.yourphoto.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Nginx再起動：
```bash
sudo systemctl restart nginx
```

---

## SSL証明書の設定

### Let's Encryptを使用

```bash
sudo certbot --nginx -d yourphoto.com -d api.yourphoto.com
```

自動更新確認：
```bash
sudo certbot renew --dry-run
```

---

## デプロイ後の確認

### 1. フロントエンドの動作確認

- `https://yourphoto.com` にアクセス
- シミュレーター画面が表示されるか確認
- プラン・オプション選択が正常に動作するか確認

### 2. バックエンドの動作確認

```bash
curl https://api.yourphoto.com/health
# 期待結果: {"status":"OK","timestamp":"..."}

curl https://api.yourphoto.com/api/simulator?shop=1
# 期待結果: JSON形式のプラン・オプションデータ
```

### 3. 管理画面の確認

- `https://yourphoto.com/login` にアクセス
- ログイン機能が動作するか確認
- プラン・オプション・キャンペーンのCRUD操作を確認

---

## トラブルシューティング

### バックエンドが起動しない

```bash
# ログを確認
pm2 logs photo-simulator

# 一般的な原因:
# 1. ポートが既に使用されている
sudo lsof -i :5000

# 2. 環境変数が正しく設定されていない
cat .env

# 3. 依存関係のインストールミス
npm install
npm run build
pm2 restart photo-simulator
```

### データベース接続エラー

1. Supabase URLとキーを確認
2. Supabase RLSポリシーを確認
3. ネットワーク接続を確認

```bash
# 接続テスト
curl https://your-project.supabase.co
```

### CORS エラー

`backend/src/server.ts` のCORS設定を確認：

```typescript
app.use(cors({
  origin: 'https://yourphoto.com',  // フロントエンドのURL
  credentials: true,
}))
```

### フロントエンドからAPIに接続できない

1. `.env.local` / Vercel環境変数で `VITE_API_URL` を確認
2. APIサーバーが起動しているか確認
3. ファイアウォール設定を確認

---

## 定期メンテナンス

### ログのローテーション

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### セキュリティアップデート

```bash
# 依存パッケージの更新
npm outdated
npm update

# 脆弱性チェック
npm audit
npm audit fix
```

### バックアップ

```bash
# データベースバックアップ（Supabaseダッシュボードから）
# 1. Database > Backups
# 2. 定期バックアップを有効化

# アプリケーションコードのバックアップ
cd ~/your-domain.com
tar -czf backup-$(date +%Y%m%d).tar.gz app/
```

---

## スケーリング

### 負荷が高い場合

1. **PM2クラスターモード**
   ```bash
   pm2 start dist/server.js -i max --name photo-simulator
   ```

2. **CDN導入**
   - CloudflareまたはAWS CloudFront

3. **データベース最適化**
   - Supabaseでインデックスを追加
   - クエリの最適化

---

## サポート

デプロイに関する問題は、GitHubのIssuesで報告してください。

- Xサーバー公式サポート: https://www.xserver.ne.jp/support/
- Supabaseドキュメント: https://supabase.com/docs
