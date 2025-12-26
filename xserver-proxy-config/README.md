# エックスサーバー プロキシ設定ガイド

## 概要
GitHub PagesでホスティングしたアプリをエックスサーバーのURL経由でアクセスできるようにする設定です。

## 構成
```
ユーザー → エックスサーバー（プロキシ） → GitHub Pages（実体）
```

## 設定手順

### 1. エックスサーバーにディレクトリを作成

```
public_html/
├── y_sogo/
│   └── simulation/
└── c_sogo/
    └── simulation/
```

### 2. .htaccess ファイルを配置

#### 横浜そごう
`public_html/y_sogo/simulation/.htaccess` に `.htaccess.y_sogo` の内容をコピー

#### 千葉そごう
`public_html/c_sogo/simulation/.htaccess` に `.htaccess.c_sogo` の内容をコピー

### 3. GitHub Pagesが有効になっていることを確認

- リポジトリ Settings → Pages
- Source: Deploy from a branch
- Branch: gh-pages (または main)

### 4. 動作確認

#### GitHub Pages直接アクセス
- https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/
- https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/c_sogo/simulation/

#### エックスサーバー経由アクセス
- https://www.watanabephoto.co.jp/y_sogo/simulation/
- https://www.watanabephoto.co.jp/c_sogo/simulation/

## 注意事項

### プロキシが使えない場合

エックスサーバーでmod_proxyが無効の場合は、リダイレクト方式に変更：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(.*)$ https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/$1 [R=301,L]
</IfModule>
```

ただし、この方式だとURLがGitHub PagesのURLに変わってしまいます。

### エラーが出る場合

1. **500 Internal Server Error**
   - mod_proxyが無効 → リダイレクト方式に変更
   - .htaccess の記述エラー → 構文確認

2. **404 Not Found**
   - GitHub Pagesのデプロイが完了していない
   - URLパスが間違っている

3. **CORS エラー**
   - GitHub Pages側で CORS 設定が必要な場合があります
