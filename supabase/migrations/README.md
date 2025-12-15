# Supabase マイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## マイグレーション実行順序

### 🆕 新規セットアップの場合

完全に新しい環境でゼロから構築する場合：

1. **001_create_base_tables.sql** - 基礎テーブル作成（shops, plans, options, campaigns等）
2. **004_create_form_builder_tables.sql** - フォームビルダーテーブル
3. **005_add_rls_policies_and_categories.sql** - RLSポリシー＋カテゴリ
4. **006_create_category_item_system.sql** - 新カテゴリシステム
5. **007_update_campaign_associations.sql** - キャンペーン関連更新

### 🔄 既存環境の場合

既にテーブルが存在する環境（本プロジェクトの開発途中から参加する場合）：

- **004, 005, 006は実行済みの可能性が高い**
- まだ実行していないマイグレーションのみ実行してください
- 007を実行する際に`campaigns`テーブルが存在しない場合のみ、001を先に実行

## マイグレーションの適用方法

### 方法1: Supabase ダッシュボード（推奨）

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左サイドバーから「SQL Editor」を選択
4. 「New query」をクリック
5. マイグレーションファイルの内容をコピー&ペースト
6. 「Run」ボタンをクリックして実行

### 方法2: Supabase CLI（開発者向け）

```bash
# プロジェクトルートで実行
supabase db push
```

## マイグレーション詳細

### 001_create_base_tables.sql（新規環境のみ）

**目的：** ゼロから構築する場合の基礎テーブル作成

**作成されるテーブル：**
- `shops`: スタジオ情報
- `plans`: 撮影プラン（旧システム・後で非推奨）
- `options`: 追加オプション（旧システム・後で非推奨）
- `campaigns`: キャンペーン
- `campaign_plan_associations`: キャンペーン×プラン関連（旧システム）

**特徴：**
- `IF NOT EXISTS`チェックで既存テーブルをスキップ
- デフォルトショップ（id=1）を自動挿入

### 004_create_form_builder_tables.sql

フォームビルダー機能のためのデータベーステーブルを作成します：

**作成されるテーブル：**
- `form_schemas`: フォームスキーマの定義
- `form_fields`: フォームフィールドの定義
- `field_options`: フィールドの選択肢
- `conditional_rules`: 条件分岐ルール（show_if, hide_if等）

**機能：**
- らかんスタイルの複雑な条件ロジック対応
- メタデータ（dataVal, dataAge, familyFlg）のサポート
- RLSポリシーによるセキュリティ保護
- パフォーマンス最適化のためのインデックス

### 005_add_rls_policies_and_categories.sql ⚠️ **重要：最優先で実行**

既存テーブルのRLSポリシーとカテゴリ管理機能を追加します：

**RLSポリシー設定（必須）：**
- shops, plans, options, campaigns, campaign_plan_associations テーブルにRLSポリシーを追加
- 認証ユーザーの読み書き権限を付与
- **このマイグレーションを実行しないと、管理画面でデータの作成・更新ができません**

**カテゴリ管理機能：**
- `plan_categories`: プランカテゴリ管理テーブル
- `option_categories`: オプションカテゴリ管理テーブル
- 初期カテゴリデータ（七五三、成人式、お宮参り、家族写真など）を自動挿入

### 006_create_category_item_system.sql

新しい3階層カテゴリシステムを構築します：

**作成されるテーブル：**
- `shooting_categories`: 撮影カテゴリ（七五三、成人式など）
- `product_categories`: 商品カテゴリ（ヘアセット、メイクなど）
- `shooting_product_associations`: 撮影↔商品の関連付け
- `items`: 実際の商品アイテム（具体的なプラン・価格）

**特徴：**
- 階層構造：撮影カテゴリ → 商品カテゴリ → アイテム
- 柔軟な関連付け（1つの撮影カテゴリに複数の商品カテゴリ）
- サンプルデータを自動挿入

### 007_update_campaign_associations.sql

キャンペーンシステムを新カテゴリ構造に対応させます：

**実行内容：**
1. 旧`campaign_plan_associations`テーブルを削除
2. 新しい関連テーブルを作成：
   - `campaign_shooting_associations`: キャンペーン×撮影カテゴリ
   - `campaign_product_associations`: キャンペーン×商品カテゴリ
   - `campaign_item_associations`: キャンペーン×アイテム

**効果：**
- キャンペーンを撮影カテゴリ、商品カテゴリ、個別アイテムのいずれにも適用可能
- より柔軟な割引設定が可能に

## トラブルシューティング

### エラー: "relation already exists"

既にテーブルが存在している場合のエラーです。

**対処法：**
- 001は既存環境では不要です（スキップしてください）
- 他のマイグレーションが既に実行済みかチェック

### エラー: "policy already exists"

ポリシーが既に存在している場合のエラーです。

**対処法：**
- そのマイグレーションは既に実行済みです
- 次のマイグレーションに進んでください

### 現在の状態を確認する方法

```sql
-- 既存テーブル一覧
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 特定テーブルの存在確認
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'campaigns'
) as campaigns_exists;
```

## 注意事項

- マイグレーションは番号順に適用してください
- **005番は必須です**：管理画面が正常に動作するために必要です
- 本番環境に適用する前に、必ずテスト環境で検証してください
- マイグレーション適用前にデータベースのバックアップを取得することを推奨します
- **001は新規セットアップ専用**：既存環境では実行不要です
