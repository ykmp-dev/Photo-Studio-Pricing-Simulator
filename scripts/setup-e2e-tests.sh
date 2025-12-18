#!/bin/bash

# ============================================================
# E2Eテスト環境のセットアップ
# ============================================================
# このスクリプトは、Playwright を使った自動テスト環境を構築します
# ============================================================

set -e

echo "📦 E2Eテスト環境をセットアップしています..."

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# Playwright のインストール確認
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx がインストールされていません"
    exit 1
fi

echo "✅ npm/npx が見つかりました"

# frontend ディレクトリに移動
cd frontend

# Playwright をインストール
echo "📦 Playwright をインストールしています..."
npm install -D @playwright/test

# Playwright ブラウザをインストール
echo "🌐 ブラウザをインストールしています..."
npx playwright install chromium

# テストディレクトリを作成
echo "📁 テストディレクトリを作成しています..."
mkdir -p tests/e2e

# Playwright 設定ファイルを作成
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

echo "✅ Playwright 設定ファイルを作成しました"

# サンプルテストを作成
cat > tests/e2e/form-builder.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test.describe('フォームビルダー', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理（必要に応じて実装）
    await page.goto('/admin');
  });

  test('ブロックの追加から更新までの一連の流れ', async ({ page }) => {
    // 1. フォームを選択
    await page.click('text=七五三撮影フォーム');

    // 2. ノードビューに遷移
    await page.click('text=ノードで作成');
    await expect(page).toHaveURL(/\/admin\/forms\/\d+\/node-view/);

    // 3. テキストブロックを追加
    await page.click('button:has-text("+ テキスト")');

    // 4. 未保存の変更が表示されることを確認
    await expect(page.locator('text=● 未保存の変更')).toBeVisible();

    // 5. 保存ボタンをクリック
    await page.click('button:has-text("保存")');

    // 6. 保存成功のアラートを確認
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('保存しました');
      await dialog.accept();
    });

    // 7. 保存済みになることを確認
    await expect(page.locator('button:has-text("保存済み")')).toBeVisible();

    // 8. 更新ボタンをクリック
    await page.click('button:has-text("更新")');

    // 9. 確認ダイアログでOKをクリック
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('お客様ページに反映');
      await dialog.accept();
    });

    // 10. 更新成功のアラートを確認
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('更新しました');
      await dialog.accept();
    });

    console.log('✅ ブロックの追加から更新までの一連の流れが正常に完了しました');
  });

  test('ブロックの編集', async ({ page }) => {
    // フォームを選択
    await page.click('text=七五三撮影フォーム');
    await page.click('text=ノードで作成');

    // ブロックをダブルクリックして編集
    const block = page.locator('.react-flow__node').first();
    await block.dblclick();

    // モーダルが表示されることを確認
    await expect(page.locator('text=ブロック編集')).toBeVisible();

    // 内容を変更
    const contentInput = page.locator('textarea[placeholder*="内容"]');
    await contentInput.fill('テスト用のテキスト');

    // 保存
    await page.click('button:has-text("保存")');

    // モーダルが閉じることを確認
    await expect(page.locator('text=ブロック編集')).not.toBeVisible();

    console.log('✅ ブロックの編集が正常に完了しました');
  });

  test('ブロックの削除', async ({ page }) => {
    // フォームを選択
    await page.click('text=七五三撮影フォーム');
    await page.click('text=ノードで作成');

    // ブロック数を記録
    const initialCount = await page.locator('.react-flow__node').count();

    // ブロックをダブルクリックして編集モーダルを開く
    const block = page.locator('.react-flow__node').first();
    await block.dblclick();

    // 削除ボタンをクリック
    await page.click('button:has-text("削除")');

    // 確認ダイアログでOKをクリック
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // ブロックが削除されたことを確認
    const newCount = await page.locator('.react-flow__node').count();
    expect(newCount).toBe(initialCount - 1);

    console.log('✅ ブロックの削除が正常に完了しました');
  });
});

test.describe('お客様ページ', () => {
  test('更新したフォームが表示される', async ({ page }) => {
    // お客様ページに移動
    await page.goto('/simulator');

    // 撮影カテゴリを選択
    await page.click('text=七五三撮影');

    // フォームが表示されることを確認
    await expect(page.locator('form')).toBeVisible();

    // ブロックが表示されることを確認
    const blocks = page.locator('[class*="block"]');
    await expect(blocks.first()).toBeVisible();

    console.log('✅ お客様ページでフォームが正常に表示されました');
  });
});
EOF

echo "✅ サンプルテストを作成しました"

# .gitignore に追加
if ! grep -q "test-results" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Playwright" >> .gitignore
    echo "test-results/" >> .gitignore
    echo "playwright-report/" >> .gitignore
    echo "playwright/.cache/" >> .gitignore
fi

echo "✅ .gitignore を更新しました"

# package.json にテストスクリプトを追加
echo "📝 package.json にテストスクリプトを追加しています..."

# テスト実行コマンドの説明を表示
cat << 'EOF'

✅ セットアップが完了しました！

📚 使い方:

1. 開発サーバーを起動:
   npm run dev

2. 別のターミナルでテストを実行:
   npx playwright test

3. UIモードでテストを実行（デバッグに便利）:
   npx playwright test --ui

4. 特定のテストのみ実行:
   npx playwright test form-builder.spec.ts

5. テストレポートを表示:
   npx playwright show-report

6. Codegen でテストを記録（自動生成）:
   npx playwright codegen http://localhost:5173

📝 次のステップ:

1. frontend/tests/e2e/form-builder.spec.ts を編集してテストを追加
2. 実際の操作をブラウザで行いながら npx playwright codegen で記録
3. CIに組み込む（GitHub Actions等）

🐛 デバッグ:

- --debug フラグを使うとステップ実行できます:
  npx playwright test --debug

- ヘッドレスモードを無効にして実際のブラウザで確認:
  npx playwright test --headed

EOF

echo "🎉 E2Eテスト環境のセットアップが完了しました！"
