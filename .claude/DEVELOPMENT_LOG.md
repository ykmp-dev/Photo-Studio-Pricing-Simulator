# 開発ログ

このファイルには、各セッションでの作業内容の概要を記録します。
詳細な実装内容は Git コミットメッセージを参照してください。

---

## 2025-12-18: UI/UX改善、フォーム一覧とブロック管理分離

**セッションID**: `cKRID`
**ブランチ**: `claude/node-view-dedicated-page-cKRID`

### 作業概要
- **フォーム一覧とブロック管理ページの分離**（UI/UX大幅改善）
- **ノードビュー/リストビュー切り替え実装**
- errorReporter自動ログ収集システム実装
- GitHub Actions リトライロジック追加（タイムアウトエラー対策）
- ドキュメント包括的更新（STATUS.md, QUICKSTART.md新規作成）

### 主な変更
- `frontend/src/pages/FormListPage.tsx` 新規作成（フォーム一覧専用）
- `frontend/src/pages/FormBlockEditorPage.tsx` 新規作成（ノード/リスト切り替え）
- `frontend/src/components/admin/FormManager.tsx` 削除（1292行 → 2ファイルに分割）
- `frontend/src/pages/FormNodeViewPage.tsx` 削除（FormBlockEditorPageに統合）
- `frontend/src/pages/Admin.tsx` 削除（未使用）
- `frontend/src/utils/errorReporter.ts` 新規作成
- `.github/workflows/auto-merge.yml` にリトライロジック追加
- `App.tsx`, `AdminDashboard.tsx` ルーティング更新

### コミット
```
25cee26 feat: フォーム一覧とブロック管理を分離、ノードビュー/リストビュー切り替え実装
37b7dc9 docs: ドキュメント構造を最適化（STATUS.md, QUICKSTART.md追加）
2295830 docs: 開発ログを包括的に更新（2025-12-16〜2025-12-18）
48a2c59 docs: ドキュメントを更新し、errorReporterシステムを説明
eb65b66 fix: errorReporter.tsのTypeScriptビルドエラーを修正
63f9232 fix: GitHub Actions auto-mergeのタイムアウトエラーを修正
791f45c feat: コンソールログ自動収集システムを実装
```

### 重要な設計決定
- **ページ構成**: /admin → FormListPage → FormBlockEditorPage（ノード/リスト切り替え）
- **UI改善**: カード形式でフォーム一覧表示、ヘッダートグルで表示切り替え
- **コード整理**: 巨大な1292行コンポーネントを削除、責任分離

---

## 2025-12-17: UI/UX大幅改善 & 診断ツール整備

**セッションID**: `cKRID`
**ブランチ**: `claude/node-view-dedicated-page-cKRID`

### 作業概要
- published_blocksテーブル分離（最重要: お客様への影響を防ぐ）
- 保存/更新ボタンの明確化（公開/下書き機能廃止）
- 包括的なロギングシステム実装
- 診断ツールとE2Eテスト環境追加

### 主な変更
- `supabase/migrations/015_create_published_blocks.sql` 新規作成
- `supabase/migrations/016_create_save_form_blocks_function.sql` 新規作成
- `frontend/src/utils/logger.ts` 新規作成
- `scripts/diagnose.sql` 新規作成
- `TROUBLESHOOTING.md`, `TEST_SCENARIO.md` 新規作成
- FormNodeViewPage.tsx, FormManager.tsx UI改善

### コミット
```
423805e docs: 診断ツールとE2Eテスト環境を追加
9750364 fix: 不要な更新ボタンを削除
44f19b3 fix: 更新ボタンのラベルを簡潔化
5633d69 refactor: 公開・下書き機能を削除し、更新ボタンに統一
23ad0bc refactor: UI/UX全体設計を大幅改善
2346cdc fix: ノード接続エラーとUX問題を修正
05bb522 fix: ノードビューのUX改善とDBマイグレーション追加
df786a2 feat: 包括的なロギングシステムを実装
030cb90 feat: published_blocksテーブル分離でサービス中断を防止
fdf1471 feat: ドラフト/公開機能を実装してフロント影響を防止
d1474d4 docs: 引き継ぎドキュメントとエラーハンドリング強化
```

### 重要な設計決定
- **データフロー**: localBlocks → form_blocks（保存）→ published_blocks（更新）
- お客様ページは published_blocks のみ参照
- 保存してもお客様に影響なし

---

## 2025-12-16: ノードビュー実装 & 税込価格統一

**セッションID**: `cKRID`
**ブランチ**: `claude/node-view-dedicated-page-cKRID`

### 作業概要
- React Flowを使用したノードビュー実装
- 税込価格表示への統一
- 横浜そごう写真館CSVデータ追加

### 主な変更
- `frontend/src/pages/FormNodeViewPage.tsx` 新規作成
- React Flow導入、自動レイアウト（Dagre）実装
- SimulatorNew.tsx の税抜表示削除
- `data/yokohama_sogo_753.csv` 追加

### コミット
```
610dec1 feat: ノードビューを洗練（左→右フロー、全ブロック接続対応）
ebc68af feat: ノードビューに3つの高優先度機能を追加
```

---

## 2025-12-15: Choice ブロック設計・実装

**セッションID**: `01BmvtLhyedN4MCeLRHfWDFK`
**ブランチ**: `claude/photo-pricing-simulator-01BmvtLhyedN4MCeLRHfWDFK`

### 作業概要
- 複数選択肢（3択以上）に対応した choice ブロック設計・実装
- プログレッシブディスクロージャー対応
- 条件分岐ブロックの独立動作修正

### 主な変更
- `formBuilder.ts` に ChoiceOption 型追加
- SimulatorNew.tsx に choice ブロック表示実装
- ラジオボタン版（2-3個）とドロップダウン版（4個以上）の自動切り替え
- 価格計算に choice 料金を統合

### コミット
```
072f4f1 feat: choiceブロック（多択選択）のUI実装完了
20d392a feat: choiceブロック用の型定義を追加
5aae47b refactor: SimulatorNew.tsxのデバッグログを削除
59c71dc fix: 条件分岐ブロックのプログレッシブディスクロージャー競合を修正
```

### 重要な設計決定
- 表示方式: 2-3個はラジオボタン、4個以上はドロップダウン
- 料金表示: 選択肢に含める（例: ライトコース（32,780円））
- プログレッシブディスクロージャー: choice未選択時は次を非表示

---

## 次回セッション用チェックリスト

新しいセッションを開始する際は、以下を確認してください：

1. [ ] **[STATUS.md](.claude/STATUS.md)** を読む（最優先、3分）
2. [ ] **[QUICKSTART.md](.claude/QUICKSTART.md)** に従う（5分）
3. [ ] 必要に応じて DEVELOPMENT_GUIDELINES.md を確認
4. [ ] `git log --oneline -10` で最新のコミットを確認
5. [ ] `git status` で作業状態を確認
6. [ ] `npm run build` でビルドが通ることを確認

**重要**: STATUS.md に現在の状態、既知の問題、次のTODOがすべて記載されています。

---

## アーカイブ

より詳細な過去の履歴は以下を参照：
- Git コミットメッセージ: `git log --oneline`
- GitHub PR: https://github.com/ykmp-dev/Photo-Studio-Pricing-Simulator/pulls

---

_このログは常に最新の情報で更新してください。_
_詳細な実装内容はコミットメッセージに記載し、このファイルは概要のみに留めてください。_
