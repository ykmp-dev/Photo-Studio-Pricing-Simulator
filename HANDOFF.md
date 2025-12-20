# 🔄 Claude Code セッション引き継ぎドキュメント

## 📅 作成日時
2025-12-20

## 🎯 現在の状態

### ✅ 完了した実装
1. **FormBuilderManager** - 撮影カテゴリタイル表示、モーダル管理
2. **FormBuilderWizard** - 4ステップのウィザード（モーダル）
3. **Step1: StepTrigger** - 最初に選ぶ項目
4. **Step2: StepConditional** - 条件付き項目
5. **Step3: StepCommonFinal** - いつも表示する項目
6. **Step4: StepPreview** - プレビュー表示
7. **CategoryManager** - v3フィールドUIを削除してシンプル化
8. **TDD Phase 1** - formBuilderLogic.ts（12/12テスト通過）

### 🔴 重大な設計変更が必要
**現在の実装は設計思想が間違っています！**

#### 現在の実装（間違い）❌
```
フォームビルダーで商品カテゴリとアイテムを新規作成
→ カテゴリ管理タブと二重管理になる
```

#### 正しい設計✅
```
【カテゴリ管理タブ】マスターデータ作成
├─ 撮影カテゴリ作成（七五三、成人式など）
├─ 商品カテゴリ作成（撮影コース、ヘアメイクなど）← キー自動生成
└─ アイテム作成（スタジオ撮影 ¥5,000など）

↓

【フォームビルダータブ】表示設定のみ
├─ 撮影カテゴリを選ぶ（七五三タイルクリック）
└─ 既存の商品カテゴリを選んで配置
    ├─ Step1: 最初に選ぶ項目（trigger）
    ├─ Step2: 分岐設定（conditional）
    └─ Step3: いつも表示（common_final）
```

## 🔧 次にやるべきこと

### 優先度：高🔥

#### 1. StepTrigger/StepConditional/StepCommonFinal の大幅修正
**変更内容：**
- ❌ 削除：商品カテゴリの新規作成フォーム（項目名、表示名、説明、選択肢入力）
- ✅ 追加：既存商品カテゴリ選択ドロップダウン
- ✅ 追加：product_type選択（丸ボタン/プルダウン/チェックボックス）
- ✅ 表示：選択した商品カテゴリのアイテム一覧（自動表示、編集不可）

**UIイメージ：**
```
┌──────────────────────────┐
│ 商品カテゴリを選ぶ *       │
│ [ドロップダウン]          │
│  - 撮影コース             │
│  - ヘアメイク             │
│  - 衣装                   │
│  - データ納品             │
└──────────────────────────┘

┌──────────────────────────┐
│ お客様はどう選びますか？   │
│ ○ 1つだけ選ぶ（丸ボタン） │
│ ○ 1つだけ選ぶ（プルダウン）│
│ ○ 複数選べる（チェックボックス）│
└──────────────────────────┘

┌──────────────────────────┐
│ 選択肢（自動表示）         │
│ ・スタジオ撮影 ¥5,000     │
│ ・ロケーション撮影 ¥10,000│
└──────────────────────────┘
```

#### 2. CategoryManager にキー自動生成機能追加
**商品カテゴリ作成時のみ：**
```typescript
// 連番方式（推奨）
name: `category_${existingCategories.length + 1}`
// → category_1, category_2, category_3...
```

#### 3. 用語変更
- 「条件付き項目」→ **「分岐設定」**
- 「新しい条件付き項目を追加」→ **「新しい分岐項目を追加」**

### 優先度：中

#### 4. FormBuilderWizard のステップインジケーター更新
- Step2のラベルを「条件付き項目」→「分岐設定」に変更

#### 5. データベース保存機能の実装
- API連携
- 保存したフォームの読み込み

## 📁 重要なファイル

### フォームビルダー関連
```
frontend/src/components/admin/
├── FormBuilderManager.tsx          # タイル表示＆モーダル管理
└── formBuilder/
    ├── FormBuilderWizard.tsx       # ウィザードメイン 🔧修正必要
    ├── StepTrigger.tsx             # Step1 🔥大幅修正必要
    ├── StepConditional.tsx         # Step2 🔥大幅修正必要
    ├── StepCommonFinal.tsx         # Step3 🔥大幅修正必要
    └── StepPreview.tsx             # Step4 ✅OK

frontend/src/types/
└── formBuilderV3.ts                # 型定義

frontend/src/utils/
├── formBuilderLogic.ts             # TDDロジック（12/12テスト通過）
└── formBuilderLogic.test.ts        # テスト
```

### カテゴリ管理関連
```
frontend/src/components/admin/
└── CategoryManager.tsx             # 🔧キー自動生成追加必要

frontend/src/services/
└── categoryService.ts              # API通信

frontend/src/types/
└── category.ts                     # 型定義
```

## 🗂️ データベーススキーマ

### shooting_categories（撮影カテゴリ）
```sql
id, shop_id, name, display_name, description, sort_order, is_active
```

### product_categories（商品カテゴリ）
```sql
id, shop_id, name, display_name, description, sort_order, is_active,
form_section, product_type, conditional_rule  -- v3フィールド
```

### items（アイテム）
```sql
id, shop_id, product_category_id, name, price, description,
sort_order, is_active, is_required, auto_select
```

## 🔑 キー情報

### Git
- **ブランチ**: `claude/node-view-dedicated-page-cKRID`
- **最新コミット**: "feat: フォームビルダーの全ウィザードステップを実装"
- **リモート**: 同期済み

### 環境
- **プロジェクトルート**: `/home/user/Photo-Studio-Pricing-Simulator`
- **フロントエンド**: `frontend/`
- **ビルドコマンド**: `npm run build`
- **開発サーバー**: `npm run dev`

## 📝 ユーザーからのフィードバック

### 主な指摘
1. 「項目名（内部用キー）は自動生成にできないの？」
2. 「撮影カテゴリタイル選択 = お客様が撮影メニューで七五三を選ぶ、でいいよね？」
3. 「項目追加は既存の商品カテゴリを使わないの？選択肢は自動反映できるよね？」
4. 「添付1枚目の赤線以下だけ編集する感じでいいんじゃ？」
5. 「条件付き項目→分岐設定に名称変更」

### ユーザーの意図
- **フォームビルダーは表示設定専用ツール**
- **商品カテゴリとアイテムはカテゴリ管理タブで作成**
- **フォームビルダーでは既存データを選んで配置するだけ**

## 🚀 実装の進め方

### Step 1: StepTrigger を修正
1. 商品カテゴリの新規作成フォームを削除
2. `getProductCategories(shopId)` で既存カテゴリ取得
3. ドロップダウンで選択
4. product_type 選択
5. 選択したカテゴリの `getItems(shopId, categoryId)` でアイテム表示

### Step 2: StepConditional を修正
- StepTrigger と同様の修正

### Step 3: StepCommonFinal を修正
- StepTrigger と同様の修正

### Step 4: CategoryManager にキー自動生成
```typescript
// 商品カテゴリ作成時
const newCategory = {
  ...
  name: `category_${draftProduct.length + 1}`, // 自動生成
  ...
}
```

### Step 5: ビルド＆テスト
```bash
cd frontend
npm run build
```

## 📌 注意事項
- ❗ TDD実装済みのロジック（formBuilderLogic.ts）は変更不要
- ❗ 型定義（formBuilderV3.ts）も基本的にそのまま使える
- ❗ FormBuilderCategory の items は既存データから取得する形に変更

## 🎯 最終ゴール
```
カテゴリ管理タブで商品カテゴリ＆アイテムを作成
    ↓
フォームビルダータブで既存データを選んで配置
    ↓
お客様画面で設定通りのフォームを表示
```

---

## 💬 引き継ぎ時に伝えること

「フォームビルダーの全4ステップを実装しましたが、設計が間違っていることが判明しました。
商品カテゴリとアイテムをフォームビルダーで新規作成していましたが、
正しくはカテゴリ管理タブで作成済みの既存データを選択する方式にする必要があります。
StepTrigger/StepConditional/StepCommonFinal の大幅修正をお願いします。」
