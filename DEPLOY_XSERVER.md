# エックスサーバーへのデプロイ手順

## 📋 概要

GitHub Pagesでホスティングしたアプリを、エックスサーバー経由でアクセスできるようにするプロキシ設定です。

```
ユーザー → エックスサーバー（プロキシ） → GitHub Pages（実体）

watanabephoto.co.jp/y_sogo/simulation/
  ↓ .htaccess プロキシ
ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/
```

## 📋 前提条件

- エックスサーバーのアカウントがある
- FTPアクセス情報がある
- GitHub Pagesへのデプロイが完了している

---

## 🏪 対象店舗

| 店舗 | shop_id | パス | 本番URL |
|------|---------|------|---------|
| 横浜そごう | 1 | `/y_sogo/simulation/` | `watanabephoto.co.jp/y_sogo/simulation/` |
| 千葉そごう | 4 | `/c_sogo/simulation/` | `watanabephoto.co.jp/c_sogo/simulation/` |

---

## 🔧 セットアップ手順

### 1. エックスサーバーにディレクトリを作成

FTPで接続し、以下のディレクトリ構造を作成:

```
public_html/
├── y_sogo/
│   └── simulation/
└── c_sogo/
    └── simulation/
```

### 2. .htaccess ファイルを配置

#### 横浜そごう

`xserver-proxy-config/.htaccess.y_sogo` の内容を
`public_html/y_sogo/simulation/.htaccess` として配置

```apache
# 横浜そごう写真館用プロキシ設定
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /y_sogo/simulation/

  # GitHub Pagesへのプロキシ
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/$1 [P,L]
</IfModule>

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
```

#### 千葉そごう

`xserver-proxy-config/.htaccess.c_sogo` の内容を
`public_html/c_sogo/simulation/.htaccess` として配置

```apache
# 千葉そごう写真館用プロキシ設定
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /c_sogo/simulation/

  # GitHub Pagesへのプロキシ
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/c_sogo/simulation/$1 [P,L]
</IfModule>

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
```

### 3. GitHub Pagesが有効になっていることを確認

- リポジトリ Settings → Pages
- デプロイが成功していること

---

## ✅ 動作確認

### GitHub Pages直接アクセス（ソース確認）
- https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/
- https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/c_sogo/simulation/

### エックスサーバー経由アクセス（本番）
- https://www.watanabephoto.co.jp/y_sogo/simulation/
- https://www.watanabephoto.co.jp/c_sogo/simulation/

### チェックリスト

#### 横浜そごう
- [ ] https://www.watanabephoto.co.jp/y_sogo/simulation/ にアクセスできる
- [ ] ページが表示される
- [ ] 撮影カテゴリが選択できる
- [ ] フォームが表示される
- [ ] 料金計算が正しく動作する

#### 千葉そごう
- [ ] https://www.watanabephoto.co.jp/c_sogo/simulation/ にアクセスできる
- [ ] ページが表示される
- [ ] 撮影カテゴリが選択できる
- [ ] フォームが表示される
- [ ] 料金計算が正しく動作する

---

## ⚠️ トラブルシューティング

### 500 Internal Server Error

**原因:** mod_proxy が無効

**解決策:** リダイレクト方式に変更

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(.*)$ https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/$1 [R=301,L]
</IfModule>
```

※ この方式だとURLがGitHub PagesのURLに変わります

### 404 Not Found

**原因:** GitHub Pagesのデプロイが完了していない、またはパスが間違っている

**解決策:**
1. GitHub Actions のデプロイ状況を確認
2. .htaccess のパスを確認

### CORS エラー

**原因:** Access-Control-Allow-Origin が設定されていない

**解決策:** .htaccess に以下を追加

```apache
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>
```

---

## 🔄 更新方法

GitHub Pagesへの自動デプロイが設定されているため、`main` ブランチにマージすれば自動的に更新されます。

1. コードを変更
2. `claude/*` ブランチにプッシュ
3. 自動マージ → GitHub Pages デプロイ
4. エックスサーバー経由でも自動的に反映

---

## 📊 環境比較

| 項目 | GitHub Pages | エックスサーバー |
|------|--------------|-----------------|
| URL | `ykmp-dev.github.io/...` | `watanabephoto.co.jp/...` |
| 用途 | テスト・開発 | 本番・リスティング広告 |
| 更新方法 | 自動デプロイ | プロキシ（自動反映） |
| SSL | 自動 | エックスサーバー設定 |

---

## 📁 関連ファイル

- `xserver-proxy-config/.htaccess.y_sogo` - 横浜そごう用.htaccess
- `xserver-proxy-config/.htaccess.c_sogo` - 千葉そごう用.htaccess
- `xserver-proxy-config/README.md` - 詳細な設定ガイド
- `.github/workflows/deploy.yml` - GitHub Pages自動デプロイ設定
