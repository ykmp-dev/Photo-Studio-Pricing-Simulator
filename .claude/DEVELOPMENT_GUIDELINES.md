# 開発ガイドライン

このプロジェクトは複数のClaude Codeセッションで共同開発されています。

## 重要な開発方針

### 1. スマホ優先（モバイルファースト）
- すべてのUIはスマホでの表示を最優先
- レスポンシブデザインを徹底
- タッチ操作を考慮した大きめのボタン・タップエリア

### 2. プログレッシブディスクロージャー
- ユーザーが前の質問に答えるまで次のブロックを表示しない
- フォームは段階的に展開される
- 条件分岐ブロック（show_condition）は独立して動作

### 3. 税込価格表示
- すべての料金は**税込価格のみ**を表示
- 「29,800円（税込）」のような表記
- 税抜価格は表示しない

### 4. デバッグログ
- 開発中は詳細なデバッグログを追加してOK
- 本番デプロイ前に必ず削除すること
- `console.log()`, `console.warn()`, `console.error()` は本番では削除

## プロジェクト構造

```
Photo-Studio-Pricing-Simulator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SimulatorNew.tsx       # 料金シミュレーター（顧客向け）
│   │   │   └── admin/
│   │   │       ├── FormManager.tsx    # フォームビルダー管理画面
│   │   │       └── CategoryManager.tsx # カテゴリ管理
│   │   ├── services/
│   │   │   ├── formBuilderService.ts  # フォーム関連API
│   │   │   ├── categoryService.ts     # カテゴリ関連API
│   │   │   └── simulatorService.ts    # シミュレーター用API
│   │   └── types/
│   │       ├── formBuilder.ts         # フォーム型定義
│   │       ├── category.ts            # カテゴリ型定義
│   │       └── campaign.ts            # キャンペーン型定義
├── supabase/
│   └── migrations/                    # DBマイグレーション
└── .claude/
    ├── DEVELOPMENT_GUIDELINES.md      # このファイル
    └── DEVELOPMENT_LOG.md             # 開発ログ
```

## データ構造

### カテゴリ階層（紐付けは削除済み）
```
ShootingCategory（撮影カテゴリ）
  例: 七五三、成人式、お宮参り

ProductCategory（商品カテゴリ）
  例: メイク、ヘアセット、アルバム、衣装

Item（アイテム）
  例: フルメイク 5,500円、ヘアセット 4,400円
```

**重要**: `shooting_product_associations` テーブルは削除済み。撮影カテゴリと商品カテゴリの直接の紐付けは使用しない。

### フォームビルダー構造

```
FormSchema
  └─ FormBlock（複数）
      ├─ BlockType
      │   ├─ text: テキスト表示
      │   ├─ heading: 見出し
      │   ├─ yes_no: Yes/No質問（2択）
      │   ├─ choice: 選択肢質問（多択）← 新機能
      │   └─ category_reference: 商品カテゴリ参照
      └─ ShowCondition（条件分岐）
          ├─ type: 'yes_no' | 'choice'
          ├─ block_id: 参照するブロックのID
          └─ value: 期待する回答値
```

## Choice ブロック仕様（2025-12-15 設計確定）

### 表示方式
- **2-3個の選択肢**: ラジオボタン（縦並び）
- **4個以上の選択肢**: ドロップダウン
- 管理画面で手動指定も可能（`choice_display: 'radio' | 'select' | 'auto'`）

### 料金表示
```
○ ライトコース（32,780円）
○ セレクトコース（45,000円）
○ プレミアムコース（68,000円）
```
- 税込価格のみ表示
- カッコ内に料金を含める（らかんスタジオ方式）

### 初期状態
- ドロップダウン: 「選択してください」（未選択）
- ラジオボタン: 未選択状態

### プログレッシブディスクロージャー
- `choice`ブロックにも適用
- 選択するまで次のブロックが表示されない
- 条件分岐ブロック（`show_condition`あり）は独立して動作

### 価格計算
- `choice`ブロックで選択された料金を合計に含める
- `selectedItems`（アイテム） + `choiceAnswers`（choice選択）の合計

## コミット規約

```
feat: 新機能追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
style: コードスタイル修正（機能変更なし）
test: テスト追加・修正
chore: ビルド・設定変更
debug: デバッグログ追加（本番前に削除）
```

## ブランチ戦略

```
main                         # 本番環境
  └─ claude/feature-name-*   # Claude Codeの作業ブランチ
```

- ブランチ名は必ず `claude/` で始める
- セッションIDを含める: `claude/choice-block-01BmvtLhyedN4MCeLRHfWDFK`

## 注意事項

### やってはいけないこと
- ❌ 税抜価格の表示
- ❌ デスクトップ優先のデザイン
- ❌ 本番環境にデバッグログを残す
- ❌ `shooting_product_associations` テーブルを使う
- ❌ フォームブロックの順序を無視した表示

### 必ずやること
- ✅ スマホでの動作確認
- ✅ プログレッシブディスクロージャーの動作確認
- ✅ 条件分岐の動作確認
- ✅ 価格計算の正確性確認
- ✅ デプロイ前にデバッグログ削除

## 引き継ぎ時のチェックリスト

新しいセッションで作業を開始する際：

1. [ ] `DEVELOPMENT_LOG.md` を読んで最新の状態を把握
2. [ ] `git log --oneline -10` で最近のコミットを確認
3. [ ] `git status` で作業ディレクトリの状態を確認
4. [ ] `npm run build` でビルドが通るか確認
5. [ ] デプロイサイトで現在の動作を確認

## 参考サイト

- **らかんスタジオ**: ドロップダウン方式の料金シミュレーター
- **横浜そごう写真館**: 3択プラン → 詳細分岐の料金体系

## 最終更新

- 日付: 2025-12-15
- 更新者: Claude Code (Session: 01BmvtLhyedN4MCeLRHfWDFK)
- 変更内容: choiceブロック設計確定、開発ガイドライン初版作成
