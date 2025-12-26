# 店舗ごとのデプロイ設定ガイド

## 概要
このアプリケーションは複数の店舗で異なるサブディレクトリにデプロイできるように設計されています。

## 設定方法

### 1. 環境変数ファイルの作成

店舗ごとに `.env.店舗名` ファイルを作成します。

**例: 横浜そごう写真館の場合 (`.env.y_sogo`)**
```env
VITE_BASE_PATH=/y_sogo/simulation/
VITE_SHOP_ID=y_sogo
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**例: 別の店舗の場合 (`.env.shibuya`)**
```env
VITE_BASE_PATH=/shibuya/simulation/
VITE_SHOP_ID=shibuya
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. package.json にビルドスクリプトを追加

```json
{
  "scripts": {
    "build:y_sogo": "tsc && vite build --mode y_sogo",
    "build:shibuya": "tsc && vite build --mode shibuya"
  }
}
```

### 3. .htaccess ファイルの準備

各店舗のビルド時に、適切な `.htaccess` が `public/` フォルダに配置されていることを確認してください。

**テンプレート:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /店舗名/simulation/
  
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /店舗名/simulation/index.html [L]
</IfModule>
```

### 4. ビルドとデプロイ

#### 横浜そごう写真館用
```bash
npm run build:y_sogo
```
→ `dist/` フォルダを `/y_sogo/simulation/` にアップロード

#### 別の店舗用
```bash
npm run build:shibuya
```
→ `dist/` フォルダを `/shibuya/simulation/` にアップロード

## デプロイ先URL

| 店舗 | ビルドコマンド | デプロイ先 | 公開URL |
|------|--------------|-----------|---------|
| 横浜そごう | `npm run build:y_sogo` | `/y_sogo/simulation/` | https://www.watanabephoto.co.jp/y_sogo/simulation |
| その他 | `npm run build:店舗名` | `/店舗名/simulation/` | https://example.com/店舗名/simulation |

## 注意事項

1. **VITE_BASE_PATH は必ず `/` で始まり `/` で終わる**
   - ✅ `/y_sogo/simulation/`
   - ❌ `y_sogo/simulation`
   - ❌ `/y_sogo/simulation`

2. **VITE_SHOP_ID はSupabaseのshopsテーブルと一致させる**

3. **.htaccess の RewriteBase と VITE_BASE_PATH を一致させる**

4. **環境変数ファイルに機密情報が含まれるため、gitignoreに追加済み**

## トラブルシューティング

### ページが真っ白になる
- `index.html` の `<script>` タグの `src` 属性を確認
- 正しいベースパスが設定されているか確認

### 404エラーになる
- `.htaccess` がアップロードされているか確認
- `RewriteBase` のパスが正しいか確認

### スタイルが適用されない
- CSS ファイルのパスが正しいか確認
- ブラウザのキャッシュをクリア
