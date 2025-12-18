# プロジェクト現状

**最終更新**: 2025-12-18 by cKRID

---

## 🚀 現在の状態

### 完了済み
- ✅ **ノードビューUI実装完了** - React Flowで視覚的なフォーム編集
- ✅ **published_blocks分離完了** - お客様への影響なしで編集可能
- ✅ **errorReporter自動ログ収集完了** - 手動確認不要
- ✅ **Choice ブロックUI実装完了** - 多択選択対応
- ✅ **包括的なドキュメント整備完了** - 診断ツール、トラブルシューティングガイド

### 保留中
- ⏳ **Choice管理UI未実装**（優先度低） - 現状は直接DBで設定可能

---

## ⚠️ 既知の問題

### 1. マイグレーション未適用の可能性
**症状**: ブロック追加できない、更新が反映されない

**原因**: マイグレーション015, 016が未適用

**解決方法**:
```bash
# Supabaseダッシュボード → SQL Editor で実行
# 1. scripts/diagnose.sql で診断
# 2. 必要に応じて以下のマイグレーションを適用
#    - supabase/migrations/015_create_published_blocks.sql
#    - supabase/migrations/016_create_save_form_blocks_function.sql
```

詳細: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

### 2. GitHub Actions auto-merge
**状態**: ✅ 修正済み（リトライロジック実装）

---

## 🎯 次にやるべきこと

1. **ユーザーからの新しいフィードバックに対応**
2. Choice管理UI実装（必要になったら）
3. E2Eテストの実装（scripts/setup-e2e-tests.sh 参照）

---

## 🔑 重要な設計決定

### データフロー
```
管理画面で編集
  ↓
localBlocks（メモリ）
  ↓ 「保存」ボタン
form_blocks（DB）← ドラフトとして保存
  ↓ 「更新」ボタン
published_blocks（DB）← お客様ページに反映
```

**重要**:
- **保存** = お客様に影響なし（form_blocksのみ更新）
- **更新** = お客様ページに反映（published_blocksにコピー）

### 公開/下書き機能の廃止
- 従来の公開/非公開ボタンは削除
- **保存** + **更新** の2ボタンに統一
- 未保存変更時に `window.beforeunload` で警告

### エラー追跡
- **errorReporter**: すべてのコンソールログを自動収集
- 開発環境: コンソールに自動出力
- 本番環境: localStorageに保存
- 手動取得: `window.errorReporter.downloadReport()`

---

## 📍 重要なファイルと場所

### コア実装
- `frontend/src/pages/FormNodeViewPage.tsx:810-826` - 保存/更新ボタン実装
- `frontend/src/utils/errorReporter.ts` - 自動ログ収集システム
- `frontend/src/utils/logger.ts` - 統一ログ出力

### データベース
- `supabase/migrations/015_create_published_blocks.sql` - 重要なマイグレーション
- `supabase/migrations/016_create_save_form_blocks_function.sql` - 保存用PostgreSQL関数

### 診断・テスト
- `scripts/diagnose.sql` - データベース診断スクリプト
- `scripts/setup-e2e-tests.sh` - E2Eテスト環境セットアップ
- `TROUBLESHOOTING.md` - トラブルシューティングガイド
- `TEST_SCENARIO.md` - 詳細なテストシナリオ

### GitHub Actions
- `.github/workflows/auto-merge.yml` - 自動PR作成・マージ（リトライロジック付き）
- `.github/workflows/deploy.yml` - GitHub Pages自動デプロイ

---

## 📊 最近の主要変更（2025-12-16〜2025-12-18）

### 2025-12-18
- errorReporter自動ログ収集システム実装
- GitHub Actions リトライロジック追加（タイムアウト対策）
- ドキュメント包括的更新

### 2025-12-17
- **published_blocksテーブル分離**（最重要）- お客様への影響を防ぐ
- UI/UX大幅改善 - 保存/更新ボタンの明確化
- 診断ツール追加 - diagnose.sql, TROUBLESHOOTING.md

### 2025-12-16
- ノードビュー（React Flow）実装開始
- 税込価格表示への統一

詳細: [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md)

---

## 🔍 トラブルシューティング

### よくある質問

**Q: ブロック追加できない**
→ A: マイグレーション015,016が未適用。[TROUBLESHOOTING.md](../TROUBLESHOOTING.md) 参照

**Q: 更新してもお客様ページに反映されない**
→ A: published_blocksテーブルが存在しない。`scripts/diagnose.sql` で診断

**Q: エラーログの確認方法**
→ A: 自動収集されています。`window.errorReporter.downloadReport()` で取得

**Q: 本番環境のログ確認**
→ A: `localStorage.getItem('error-reports')` で確認可能

---

## 🎓 新セッション開始時の手順

1. **この STATUS.md を読む**（3分）
2. **[QUICKSTART.md](./QUICKSTART.md) に従う**（5分）
3. 必要に応じて他のドキュメントを参照

---

_このファイルは毎回のセッション終了時に更新してください_
