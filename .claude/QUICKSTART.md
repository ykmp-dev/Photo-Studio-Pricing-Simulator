# 新セッション クイックスタート

このガイドに従えば、10分以内に開発を開始できます。

---

## ステップ1: 必読ドキュメント（5分）

### 最優先で読む
1. **[STATUS.md](./STATUS.md)** - 現在の状態、既知の問題、次のTODO
2. **[DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md)** - 開発ルールと重要な方針

### 必要に応じて読む
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - 問題が発生した場合
- **[DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)** - 過去の変更履歴

---

## ステップ2: 状況確認（5分）

### Gitの状態確認
```bash
# 現在のブランチを確認
git branch --show-current

# 作業状態を確認
git status

# 最近のコミットを確認
git log --oneline -5
```

### ビルド確認
```bash
cd frontend
npm run build
```

**エラーが出た場合**:
- TypeScriptエラー → コード修正が必要
- 依存関係エラー → `npm install` を実行

### 開発サーバー起動
```bash
npm run dev
# http://localhost:5173 で確認
```

---

## ステップ3: よくある問題の確認

### ブロック追加できない / 更新が反映されない

**最も可能性が高い原因**: マイグレーション未適用

**診断方法**:
1. Supabaseダッシュボードを開く
2. SQL Editor に移動
3. `scripts/diagnose.sql` の内容を実行

**結果の見方**:
```sql
-- published_blocks テーブルが存在するか？
table_name         | exists
-------------------+--------
published_blocks   | false   ← ❌ これが問題

-- save_form_blocks 関数が存在するか？
function_name      | exists
-------------------+--------
save_form_blocks   | false   ← ❌ これが問題
```

**解決方法**:
1. `supabase/migrations/015_create_published_blocks.sql` を実行
2. `supabase/migrations/016_create_save_form_blocks_function.sql` を実行
3. 再度 `scripts/diagnose.sql` で確認

詳細: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

## ステップ4: エラーログの確認

### 自動収集されたログの確認

すべてのコンソールログは自動的に収集されています。

**ブラウザコンソールで実行**:
```javascript
// ログ一覧を取得
window.errorReporter.getLogs()

// レポートをJSONでダウンロード
window.errorReporter.downloadReport()

// 本番環境のログ確認
JSON.parse(localStorage.getItem('error-reports'))
```

**開発環境**: エラー発生時に自動的にコンソールに詳細レポートが表示されます
**本番環境**: localStorageに自動保存されます

---

## ステップ5: 作業開始

### ユーザーからの新しいフィードバックがある場合

1. フィードバックの内容を確認
2. STATUS.md の「次にやるべきこと」を更新
3. 必要に応じて TodoWrite ツールでタスク管理
4. 実装開始

### 既存の問題に対応する場合

1. STATUS.md の「既知の問題」を確認
2. TROUBLESHOOTING.md で解決方法を確認
3. 対応完了後、STATUS.md を更新

---

## よくある質問

### Q: どのブランチで作業すればいい？

A: 新しいブランチを作成してください。命名規則:
```bash
claude/feature-name-{sessionId}
# 例: claude/choice-management-ui-xyz123
```

### Q: コミットメッセージの書き方は？

A: [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) のコミット規約を参照:
```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
```

### Q: 重要な設計決定を理解したい

A: [STATUS.md](./STATUS.md) の「重要な設計決定」セクションを参照:
- データフロー（localBlocks → form_blocks → published_blocks）
- 保存/更新の違い
- errorReporter の使い方

### Q: テストはどうする？

A:
- **手動テスト**: [TEST_SCENARIO.md](../TEST_SCENARIO.md) 参照
- **E2Eテスト**: `scripts/setup-e2e-tests.sh` でセットアップ
- **診断**: `scripts/diagnose.sql` でDB状態確認

---

## セッション終了時のチェックリスト

作業終了時には以下を実行してください:

- [ ] コミット・プッシュ完了
- [ ] [STATUS.md](./STATUS.md) を更新
  - [ ] 現在の状態
  - [ ] 既知の問題（新しい問題があれば追加）
  - [ ] 次にやるべきこと
- [ ] [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) に簡潔に追記
  - [ ] 日付、作業概要、主なコミットハッシュ
- [ ] 重要な設計決定があれば STATUS.md に反映

---

## 困ったときの参照先

| 問題 | 参照先 |
|------|--------|
| プロジェクト全体の状態を知りたい | [STATUS.md](./STATUS.md) |
| 開発ルールを確認したい | [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) |
| エラーが発生した | [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) |
| テスト方法を知りたい | [TEST_SCENARIO.md](../TEST_SCENARIO.md) |
| 過去の変更履歴を見たい | [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) または `git log` |
| データベース診断 | `scripts/diagnose.sql` |
| E2Eテスト環境構築 | `scripts/setup-e2e-tests.sh` |

---

**次のステップ**: [STATUS.md](./STATUS.md) の「次にやるべきこと」を確認して作業開始！
