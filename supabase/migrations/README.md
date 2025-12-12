# Supabase マイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーションの適用方法

### 方法1: Supabase ダッシュボード（推奨）

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択
4. 「New query」をクリック
5. マイグレーションファイル（`004_create_form_builder_tables.sql`など）の内容をコピー&ペースト
6. 「Run」ボタンをクリックして実行

### 方法2: Supabase CLI（開発者向け）

Supabase CLIをインストールしている場合：

```bash
# プロジェクトルートで実行
supabase db push
```

## マイグレーション一覧

### 004_create_form_builder_tables.sql

フォームビルダー機能のためのデータベーステーブルを作成します：

- `form_schemas`: フォームスキーマの定義
- `form_fields`: フォームフィールドの定義
- `field_options`: フィールドの選択肢
- `conditional_rules`: 条件分岐ルール（show_if, hide_if等）

**機能：**
- らかんスタイルの複雑な条件ロジック対応
- メタデータ（dataVal, dataAge, familyFlg）のサポート
- RLSポリシーによるセキュリティ保護
- パフォーマンス最適化のためのインデックス

## 注意事項

- マイグレーションは番号順に適用してください
- 本番環境に適用する前に、必ずテスト環境で検証してください
- マイグレーション適用前にデータベースのバックアップを取得することを推奨します
