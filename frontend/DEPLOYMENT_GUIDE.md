# デプロイガイド - そごう写真館 2店舗展開

## 店舗一覧

| 店舗名 | 店舗ID | ビルドコマンド | デプロイ先 | 公開URL |
|--------|--------|---------------|-----------|---------|
| 横浜そごう写真館 | y_sogo | `npm run build:y_sogo` | `/y_sogo/simulation/` | https://www.watanabephoto.co.jp/y_sogo/simulation |
| 千葉そごう写真館 | c_sogo | `npm run build:c_sogo` | `/c_sogo/simulation/` | https://www.watanabephoto.co.jp/c_sogo/simulation |

---

## 🚀 デプロイ手順

### 1. 初回セットアップ（Supabase）

各店舗のデータをSupabaseに登録：

```sql
-- 横浜そごう写真館
INSERT INTO shops (name, owner_email) VALUES
('横浜そごう写真館', 'admin@watanabephoto.co.jp')
ON CONFLICT (name) DO NOTHING;

-- 千葉そごう写真館
INSERT INTO shops (name, owner_email) VALUES
('千葉そごう写真館', 'admin-chiba@watanabephoto.co.jp')
ON CONFLICT (name) DO NOTHING;

-- 店舗IDを確認
SELECT id, name FROM shops ORDER BY id;
```

### 2. 環境変数ファイルの設定

実際のSupabase情報を設定します：

#### `.env.y_sogo` (横浜そごう)
```env
VITE_BASE_PATH=/y_sogo/simulation/
VITE_SHOP_ID=1  # ← Supabaseで確認したID
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

#### `.env.c_sogo` (千葉そごう)
```env
VITE_BASE_PATH=/c_sogo/simulation/
VITE_SHOP_ID=2  # ← Supabaseで確認したID
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 3. ビルド

#### 横浜そごう用
```bash
cd frontend
npm run build:y_sogo
```

#### 千葉そごう用
```bash
cd frontend
npm run build:c_sogo
```

### 4. .htaccess の準備

各店舗用に `.htaccess` ファイルを準備（`public/.htaccess` をコピーして編集）

#### 横浜そごう用
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /y_sogo/simulation/
  
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /y_sogo/simulation/index.html [L]
</IfModule>
```

#### 千葉そごう用
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /c_sogo/simulation/
  
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /c_sogo/simulation/index.html [L]
</IfModule>
```

### 5. エックスサーバーへアップロード

FTPまたはファイルマネージャーで `dist/` の中身をアップロード：

#### 横浜そごう
```
public_html/
└── y_sogo/
    └── simulation/
        ├── .htaccess      ← 横浜そごう用
        ├── index.html
        └── assets/
```

#### 千葉そごう
```
public_html/
└── c_sogo/
    └── simulation/
        ├── .htaccess      ← 千葉そごう用
        ├── index.html
        └── assets/
```

---

## ✅ 動作確認チェックリスト

### 横浜そごう（y_sogo）
- [ ] https://www.watanabephoto.co.jp/y_sogo/simulation/ にアクセスできる
- [ ] ロゴが表示される
- [ ] 撮影カテゴリが表示される（横浜そごうのデータ）
- [ ] 管理画面 `/admin` にアクセスできる
- [ ] ページリロードで404にならない

### 千葉そごう（c_sogo）
- [ ] https://www.watanabephoto.co.jp/c_sogo/simulation/ にアクセスできる
- [ ] ロゴが表示される
- [ ] 撮影カテゴリが表示される（千葉そごうのデータ）
- [ ] 管理画面 `/admin` にアクセスできる
- [ ] ページリロードで404にならない

---

## 🔧 トラブルシューティング

### ページが真っ白
→ ブラウザの開発者ツールでエラーを確認
→ `index.html` の `<script>` タグのパスが正しいか確認

### 404エラー
→ `.htaccess` がアップロードされているか確認
→ `RewriteBase` のパスが正しいか確認

### 別の店舗のデータが表示される
→ `.env.店舗名` の `VITE_SHOP_ID` が正しいか確認
→ 正しい環境変数でビルドしたか確認（`npm run build:店舗名`）

### CSSが適用されない
→ ブラウザのキャッシュをクリア
→ CSS ファイルのパスが正しいか確認

---

## 📊 管理画面での店舗データ管理

各店舗の管理画面は独立しています：

- **横浜そごう管理画面:** https://www.watanabephoto.co.jp/y_sogo/simulation/admin
- **千葉そごう管理画面:** https://www.watanabephoto.co.jp/c_sogo/simulation/admin

管理画面で追加したデータは、そのshop_idに紐づくため、店舗間でデータが混ざることはありません。

---

## 📝 更新手順

コードを更新した場合：

```bash
# 1. 最新のコードを取得
git pull

# 2. 依存関係を更新（必要に応じて）
cd frontend
npm install

# 3. 両店舗をビルド
npm run build:y_sogo
npm run build:c_sogo

# 4. それぞれアップロード
# - y_sogo用のdist/ → /y_sogo/simulation/
# - c_sogo用のdist/ → /c_sogo/simulation/
```

---

## 🎯 重要なポイント

1. **環境変数ファイルは機密情報** - gitにコミットしない（.gitignore設定済み）
2. **VITE_SHOP_ID は必ず正しい値を設定** - これで店舗を識別します
3. **.htaccess を忘れずにアップロード** - React Routerが動作するために必須
4. **ビルドコマンドを間違えない** - y_sogo用は`build:y_sogo`、c_sogo用は`build:c_sogo`
