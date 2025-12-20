# トラブルシューティングガイド

## 現在報告されている問題

### 1. ブロックの追加ができない
### 2. 更新を押してもフロントに反映されていない

---

## 🔍 問題診断の手順

### ステップ1: データベースの状態確認

Supabaseダッシュボード → SQL Editor で以下を実行:

```bash
# 診断スクリプトを実行
cat scripts/diagnose.sql
```

または、Supabaseダッシュボードで直接実行:

```sql
-- テーブル存在確認
SELECT
  'published_blocks' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'published_blocks'
  ) as exists;
```

**結果が `false` の場合**: マイグレーション未適用が原因です

---

### ステップ2: ブラウザコンソールの確認

1. Chrome DevTools を開く（F12）
2. Console タブを開く
3. フォームビルダーページを操作
4. 以下のようなログが表示されるか確認:

```
[INFO] [FormNodeViewPage] USER ACTION: Block add
[INFO] [FormNodeViewPage] Adding new block to local state
```

**エラーが表示される場合**: コンソールのエラーメッセージをコピーしてください

---

### ステップ3: ネットワークタブの確認

1. Chrome DevTools → Network タブ
2. 「保存」または「更新」ボタンをクリック
3. 失敗したリクエスト（赤色）がないか確認

**404エラーが出る場合**: テーブルまたは関数が存在しません

---

## 🛠️ 解決方法

### 解決策1: マイグレーションの適用

最も可能性が高い原因は、**マイグレーションが未適用**です。

#### 手順:

1. Supabaseダッシュボードを開く
2. SQL Editor に移動
3. 以下の2つのマイグレーションを順番に実行:

**① `015_create_published_blocks.sql` を実行**

```sql
-- 内容をコピー&ペースト
```

ファイルパス: `supabase/migrations/015_create_published_blocks.sql`

**② `016_create_save_form_blocks_function.sql` を実行**

```sql
-- 内容をコピー&ペースト
```

ファイルパス: `supabase/migrations/016_create_save_form_blocks_function.sql`

4. 実行後、診断スクリプトを再実行して確認

---

### 解決策2: ブラウザキャッシュのクリア

マイグレーション適用後、古いJavaScriptがキャッシュされている可能性があります。

#### 手順:

1. Chrome DevTools を開く（F12）
2. Network タブを開く
3. "Disable cache" にチェック
4. ページをリロード（Cmd+Shift+R / Ctrl+Shift+R）

---

### 解決策3: フロントエンドの再ビルド

最新のコードが反映されていない可能性があります。

```bash
cd frontend
npm run build
```

---

## 📊 診断結果の読み方

### テーブル存在確認の結果

```sql
table_name         | exists
-------------------+--------
form_schemas       | true
form_blocks        | true
published_blocks   | false   ← ❌ これが原因
```

→ **対処**: マイグレーション015を適用

---

### 関数存在確認の結果

```sql
function_name      | exists
-------------------+--------
save_form_blocks   | false   ← ❌ これが原因
```

→ **対処**: マイグレーション016を適用

---

### フォームデータの状態

```sql
id | name           | draft_blocks | published_blocks
---+----------------+--------------+------------------
1  | 七五三撮影     | 5            | 0                ← ❌ お客様に表示されない
```

→ **対処**: 「更新」ボタンをクリックして published_blocks にコピー

---

## 🧪 テスト手順

### 手動テスト

詳細なテスト手順は `TEST_SCENARIO.md` を参照してください。

```bash
cat TEST_SCENARIO.md
```

### 自動テスト（推奨）

E2Eテスト環境をセットアップすると、自動でテストできます。

```bash
# セットアップ（初回のみ）
bash scripts/setup-e2e-tests.sh

# テスト実行
cd frontend
npx playwright test

# UIモードでテスト（デバッグに便利）
npx playwright test --ui
```

---

## 🔄 PDCA サイクル

### Plan（計画）

1. TEST_SCENARIO.md に基づいてテストシナリオを計画
2. 期待される動作を明確にする

### Do（実行）

1. 手動テストまたは自動テストを実行
2. ログを記録

### Check（確認）

1. ブラウザコンソールのログを確認
2. ネットワークタブのリクエストを確認
3. データベースの状態を確認（diagnose.sql）

### Act（改善）

1. 問題を特定
2. 修正を実装
3. テストを再実行して検証

---

## 📝 ログの見方

### 正常なログ（ブロック追加）

```
[INFO] [FormNodeViewPage] USER ACTION: Block add { blockType: 'text' }
[INFO] [FormNodeViewPage] Adding new block to local state
[INFO] [FormNodeViewPage] STATE CHANGE: hasChanges false → true
[INFO] [FormNodeViewPage] Block added to local state { totalBlocks: 6 }
```

### 正常なログ（保存）

```
[INFO] [FormNodeViewPage] FUNCTION START: handleSave
[INFO] [FormNodeViewPage] USER ACTION: Save clicked
[INFO] [FormNodeViewPage] Starting save process
[INFO] [FormNodeViewPage] API REQUEST: RPC save_form_blocks
[INFO] [FormNodeViewPage] API RESPONSE: RPC save_form_blocks Success
[INFO] [FormNodeViewPage] Form saved successfully
```

### エラーログ（保存失敗）

```
[ERROR] [FormNodeViewPage] API ERROR: RPC save_form_blocks
{
  message: "function save_form_blocks does not exist",
  code: "PGRST202"
}
```

→ **原因**: save_form_blocks 関数が存在しない
→ **対処**: マイグレーション016を適用

### エラーログ（更新失敗）

```
[ERROR] [FormNodeViewPage] API ERROR: PATCH forms/1/publish
{
  message: "relation \"published_blocks\" does not exist",
  code: "42P01"
}
```

→ **原因**: published_blocks テーブルが存在しない
→ **対処**: マイグレーション015を適用

---

## 🆘 それでも解決しない場合

以下の情報を共有してください:

### 1. 診断結果

```bash
# Supabaseで実行した結果をコピー
cat scripts/diagnose.sql
```

### 2. ブラウザコンソールのログ

Chrome DevTools → Console タブの内容をコピー

### 3. ネットワークエラー

Chrome DevTools → Network タブで失敗したリクエストのレスポンスをコピー

### 4. 環境情報

```bash
# Node.jsバージョン
node --version

# npmバージョン
npm --version

# ブラウザバージョン
# Chrome → 設定 → Chromeについて
```

---

## 📚 関連ドキュメント

- [TEST_SCENARIO.md](./TEST_SCENARIO.md) - 詳細なテスト手順
- [scripts/diagnose.sql](./scripts/diagnose.sql) - 診断SQL
- [scripts/setup-e2e-tests.sh](./scripts/setup-e2e-tests.sh) - E2Eテスト環境構築
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システムアーキテクチャ
- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - リファクタリング計画

---

## ✅ チェックリスト

問題が解決したか確認してください:

- [ ] ブロックの追加ができる
- [ ] 保存ボタンをクリックすると「保存しました」が表示される
- [ ] 更新ボタンをクリックすると「フォームを更新しました」が表示される
- [ ] お客様ページで更新したフォームが表示される
- [ ] ブラウザコンソールにエラーが表示されない
- [ ] ネットワークタブに失敗したリクエストがない

すべてチェックできたら、正常に動作しています！🎉

---

## 🚨 自動エラー追跡システム (errorReporter)

### 概要

このプロジェクトには、すべてのコンソールログを自動的に収集するシステムが組み込まれています。
手動でコンソールを確認する必要はありません。

### 機能

- **自動収集**: すべてのconsole.log/info/warn/error/debugを傍受
- **セッション追跡**: 各ブラウザセッションにユニークIDを付与
- **自動保存**: メモリ（最大100件）とlocalStorage（最大10レポート）に保存
- **エラー時自動レポート**: console.errorが呼ばれると自動的にレポート生成
- **グローバルエラーキャッチ**: 未処理のエラーも自動記録

### 使い方

#### 開発環境での確認

エラーが発生すると、自動的にコンソールに詳細レポートが表示されます：

```
📊 Error Report
Session ID: 1234567890-abc123
URL: http://localhost:5173/admin
Timestamp: 2025-12-18T12:00:00.000Z
┌─────┬──────────┬─────────┬──────────┬──────────────┐
│ ... │ timestamp│  level  │ context  │   message    │
├─────┼──────────┼─────────┼──────────┼──────────────┤
│ ... │   ...    │   ...   │   ...    │     ...      │
└─────┴──────────┴─────────┴──────────┴──────────────┘
```

#### 本番環境での確認

エラーは自動的にlocalStorageに保存されます。ブラウザのコンソールで以下を実行：

```javascript
// 保存されたすべてのエラーレポートを表示
JSON.parse(localStorage.getItem('error-reports'))

// 現在のセッションのログを表示
window.errorReporter.getLogs()

// レポートをJSON形式でダウンロード
window.errorReporter.downloadReport()
```

#### 手動操作

```javascript
// 現在のログを取得（最大100件）
window.errorReporter.getLogs()

// ログをクリア
window.errorReporter.clearLogs()

// エラーレポートを手動送信
window.errorReporter.sendReport()

// レポートをダウンロード（error-report-{sessionId}.json）
window.errorReporter.downloadReport()
```

### エラーレポートの内容

ダウンロードされたレポート（JSON）には以下が含まれます：

```json
{
  "sessionId": "1234567890-abc123",
  "url": "https://example.com/admin",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2025-12-18T12:00:00.000Z",
  "logs": [
    {
      "timestamp": "2025-12-18T11:59:55.000Z",
      "level": "info",
      "context": "FormNodeViewPage",
      "message": "USER ACTION: Block add",
      "data": { "blockType": "text" }
    },
    {
      "timestamp": "2025-12-18T12:00:00.000Z",
      "level": "error",
      "context": "FormNodeViewPage",
      "message": "API ERROR: RPC save_form_blocks",
      "data": { "code": "PGRST202" }
    }
  ],
  "error": {
    "message": "function save_form_blocks does not exist",
    "stack": "Error: function save_form_blocks does not exist\n    at..."
  }
}
```

### トラブルシューティング

#### Q: エラーレポートが表示されない

A: 以下を確認してください：
1. ブラウザのコンソールが開いている
2. `window.errorReporter` が利用可能か確認
3. localStorageが有効になっているか確認

```javascript
// errorReporterが読み込まれているか確認
console.log(window.errorReporter)  // undefined でなければOK
```

#### Q: 古いレポートを削除したい

A: localStorageをクリアしてください：

```javascript
// エラーレポートのみ削除
localStorage.removeItem('error-reports')
localStorage.removeItem('error-reporter-logs')
localStorage.removeItem('error-reporter-session')

// または window.errorReporter を使用
window.errorReporter.clearLogs()
```

#### Q: 本番環境でレポートを取得したい

A: 以下の手順でダウンロードできます：

1. F12キーでデベロッパーツールを開く
2. Consoleタブを開く
3. 以下を実行：
   ```javascript
   window.errorReporter.downloadReport()
   ```
4. `error-report-{sessionId}.json` がダウンロードされます

### エラーレポートの共有

問題を報告する際は、以下を含めてください：

1. **エラーレポートのJSON**: `window.errorReporter.downloadReport()` で取得
2. **再現手順**: どのような操作でエラーが発生したか
3. **環境情報**: ブラウザ、OS、画面サイズなど

---

## 📚 更新履歴

### 2025-12-18
- 自動エラー追跡システム (errorReporter) を追加
- GitHub Actions auto-merge にリトライロジックを追加
- ビルドエラーの修正

### 2025-12-17
- TROUBLESHOOTING.md 初版作成
- TEST_SCENARIO.md 作成
- scripts/diagnose.sql 作成
