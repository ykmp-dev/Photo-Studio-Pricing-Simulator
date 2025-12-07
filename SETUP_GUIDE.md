# クイックスタートガイド

このガイドでは、写真館向け料金シミュレーターを最短で動かす手順を説明します。

## ⚡ 5分でローカル起動

### ステップ1: Supabaseプロジェクトの作成（3分）

1. [Supabase](https://supabase.com/)にアクセスして新規プロジェクトを作成

2. SQL Editorを開いて、以下を順番に実行：
   - `database/schema.sql` の内容をコピー&ペーストして実行
   - `database/rls_policies.sql` の内容をコピー&ペーストして実行
   - `database/sample_data.sql` の内容をコピー&ペーストして実行

3. Settings > API から以下をコピー：
   - Project URL
   - anon/public key
   - service_role key（バックエンド用）

### ステップ2: フロントエンドの起動（1分）

```bash
cd frontend
npm install

# .env.localを作成
cat > .env.local << EOF
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_API_URL=http://localhost:5000/api
VITE_DEFAULT_SHOP_ID=1
EOF

npm run dev
```

ブラウザで http://localhost:3000 を開く

### ステップ3: バックエンドの起動（1分）

別のターミナルで：

```bash
cd backend
npm install

# .envを作成
cat > .env << EOF
PORT=5000
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NODE_ENV=development
EOF

npm run dev
```

### ステップ4: 管理者ユーザーの作成

Supabase Dashboard > Authentication > Users で新規ユーザーを作成：
- Email: admin@example.com
- Password: 任意のパスワード

その後、SQL Editorで実行：

```sql
UPDATE shops
SET owner_email = 'admin@example.com'
WHERE id = 1;
```

### 完了！

- シミュレーター: http://localhost:3000
- 管理画面: http://localhost:3000/login
  - Email: admin@example.com
  - Password: 設定したパスワード

---

## 🎨 カスタマイズチェックリスト

初めて使う方向けの設定項目リスト：

### 1. ブランドカラーの変更

`frontend/tailwind.config.js`

```javascript
colors: {
  primary: {
    600: '#0284c7',  // ← ここを変更
  }
}
```

### 2. 店舗情報の更新

Supabase Dashboard > Table Editor > shops テーブル

- `name`: 店舗名を変更
- `owner_email`: 管理者メールアドレス

### 3. プランの追加・編集

管理画面 > プラン管理 から追加・編集

または、SQL Editorで直接：

```sql
INSERT INTO plans (shop_id, name, base_price, description, category, sort_order)
VALUES (1, '新プラン名', 50000, 'プランの説明', 'カテゴリ名', 1);
```

### 4. オプションの追加・編集

管理画面 > オプション管理 から追加・編集

### 5. キャンペーンの作成

管理画面 > キャンペーン管理 から作成

### 6. 予約ボタンのリンク先変更

`frontend/src/components/Simulator.tsx` 222行目付近：

```tsx
<button
  className="btn-primary"
  onClick={() => window.location.href = 'https://your-booking-url.com'}
>
  予約はこちら
</button>
```

---

## 🚀 よくある質問

### Q1: サンプルデータを削除したい

```sql
DELETE FROM campaign_plan_associations;
DELETE FROM campaigns;
DELETE FROM options;
DELETE FROM plans;
```

### Q2: 店舗を追加したい

```sql
INSERT INTO shops (name, owner_email)
VALUES ('新店舗名', 'new-admin@example.com');
```

新しい管理者アカウントをSupabase Authで作成し、`owner_email`を合わせてください。

### Q3: データベースをリセットしたい

Supabase Dashboard > Database > Tables で各テーブルを削除してから、
`database/schema.sql` を再実行してください。

### Q4: エラー「Missing Supabase environment variables」が出る

環境変数ファイル（`.env.local` / `.env`）が正しく作成されているか確認してください。

### Q5: 管理画面にログインできない

1. Supabase Dashboard > Authentication > Users でユーザーが作成されているか確認
2. `shops` テーブルの `owner_email` とユーザーのメールアドレスが一致しているか確認

---

## 📚 次のステップ

- [README.md](./README.md) - 詳細なドキュメント
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 本番環境へのデプロイ手順

---

## 🆘 トラブルシューティング

### ポート3000が既に使われている

```bash
# 別のポートで起動
npm run dev -- --port 3001
```

### ポート5000が既に使われている

`.env` の `PORT` を変更：

```env
PORT=5001
```

フロントエンドの `.env.local` も更新：

```env
VITE_API_URL=http://localhost:5001/api
```

### CORS エラーが出る

`backend/src/server.ts` の CORS設定を確認：

```typescript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))
```

### データが表示されない

1. バックエンドが起動しているか確認
2. ブラウザのコンソールでエラーを確認
3. `database/sample_data.sql` が正しく実行されたか確認

---

## 💡 開発のヒント

### ホットリロード

フロントエンド・バックエンドともに、ファイルを変更すると自動で再読み込みされます。

### データベースの変更

`database/schema.sql` を変更した場合は、Supabaseで再実行が必要です。

### TypeScript型エラー

型定義は `frontend/src/types/index.ts` にまとまっています。

---

Happy Coding! 🎉
