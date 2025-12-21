# エックスサーバーへのデプロイ手順

## 📋 前提条件

- エックスサーバーのアカウントがある
- FTPアクセス情報がある
- Supabaseのプロジェクト情報がある

---

## 🔧 準備

### 1. 環境変数を設定

`frontend/.env.production` を編集して、実際の値に置き換えてください:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SHOP_ID=1
VITE_BASE_PATH=/y_sogo/simulator
```

**取得方法:**
1. Supabaseダッシュボード → Project Settings → API
2. `Project URL` → `VITE_SUPABASE_URL`
3. `anon public` → `VITE_SUPABASE_ANON_KEY`

---

## 🏗️ ビルド

### ローカルでビルド

```bash
cd frontend
npm run build:xserver
```

成功すると `dist/` フォルダが生成されます。

---

## 📤 アップロード

### FTPでアップロード

**アップロード先:**
```
/public_html/y_sogo/simulator/
```

**アップロードするファイル:**
```
dist/ の中身を全て
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── .htaccess
```

### FileZilla での手順例:

1. FileZilla を起動
2. ホスト: `ftp.watanabephoto.co.jp`（またはエックスサーバーのFTPホスト）
3. ユーザー名: `your-ftp-username`
4. パスワード: `your-ftp-password`
5. ポート: `21`
6. 接続
7. リモートサイト: `/public_html/y_sogo/` に移動
8. `simulator` フォルダを作成（なければ）
9. `simulator` フォルダに移動
10. ローカルの `dist/` フォルダの**中身を全て**ドラッグ&ドロップ

---

## ✅ 確認

アクセスして動作確認:

```
https://www.watanabephoto.co.jp/y_sogo/simulator/
```

### チェックリスト:

- [ ] ページが表示される
- [ ] ヘッダー・フッターが表示される
- [ ] 撮影カテゴリが選択できる
- [ ] フォームが表示される
- [ ] 料金計算が正しく動作する
- [ ] 予約ボタンが表示される

---

## 🔄 更新方法

コードを変更した後:

1. ローカルでビルド:
   ```bash
   cd frontend
   npm run build:xserver
   ```

2. FTPで上書きアップロード:
   - `dist/` の中身を全て
   - `/public_html/y_sogo/simulator/` に上書き

---

## ⚠️ トラブルシューティング

### ページが真っ白

**原因:** ベースパスの設定が間違っている

**解決策:**
1. `.env.production` の `VITE_BASE_PATH` を確認
2. 再ビルド
3. 再アップロード

### CSS・JSが読み込まれない

**原因:** ファイルパスが間違っている

**解決策:**
1. `.htaccess` が正しくアップロードされているか確認
2. ブラウザのキャッシュをクリア

### Supabaseに接続できない

**原因:** 環境変数が間違っている

**解決策:**
1. `.env.production` のSupabase情報を確認
2. Supabaseダッシュボードで設定を確認
3. 再ビルド

### React Routerが動作しない（404エラー）

**原因:** `.htaccess` が正しく設定されていない

**解決策:**
1. `.htaccess` がアップロードされているか確認
2. エックスサーバーで mod_rewrite が有効か確認

---

## 📊 本番環境とGitHub Pagesの使い分け

| 環境 | URL | 用途 | ビルドコマンド |
|------|-----|------|---------------|
| **エックスサーバー** | `watanabephoto.co.jp/y_sogo/simulator/` | 本番環境・リスティング広告 | `npm run build:xserver` |
| **GitHub Pages** | `ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/` | テスト環境・開発用 | `npm run build` |

---

## 🎯 次のステップ

1. [x] ビルド設定
2. [x] .htaccess作成
3. [ ] `.env.production` に実際の値を設定
4. [ ] ビルド実行
5. [ ] FTPアップロード
6. [ ] 動作確認
7. [ ] Google Analytics設定（オプション）
8. [ ] リスティング広告設定（オプション）
