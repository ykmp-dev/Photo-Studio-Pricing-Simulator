# CLAUDE.md - AI Assistant Guide

**Last Updated**: 2025-12-26
**Purpose**: Comprehensive guide for AI assistants (like Claude Code) to understand and contribute to the Photo Studio Pricing Simulator codebase.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Codebase Overview](#codebase-overview)
3. [Architecture](#architecture)
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Common Tasks](#common-tasks)
7. [Important Gotchas](#important-gotchas)
8. [Testing & Deployment](#testing--deployment)
9. [Reference Documentation](#reference-documentation)

---

## Quick Start

### First Time Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with Supabase credentials

# 4. Start development server
npm run dev  # Runs on http://localhost:3000
```

### Before Making Changes

1. **Read Recent Commits**: `git log --oneline -10`
2. **Check Development Log**: Read `.claude/DEVELOPMENT_LOG.md`
3. **Verify Build**: `npm run build` (should succeed)
4. **Check Migration Status**: Review `supabase/migrations/` for recent changes

### Current Branch Strategy

- **Main branch**: `main` (production)
- **Claude branches**: `claude/*` (auto-merged via GitHub Actions)
- **Current working branch**: `claude/add-claude-documentation-PhdeZ`

---

## Codebase Overview

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 18.2.0 |
| **Build Tool** | Vite | 5.0.8 |
| **Styling** | Tailwind CSS | 3.3.6 |
| **Database** | Supabase (PostgreSQL) | - |
| **Authentication** | Supabase Auth | - |
| **Visual Editor** | React Flow | 11.11.4 |
| **Deployment** | GitHub Pages | - |
| **Testing** | Vitest + React Testing Library | 4.0.16 |

### Project Structure

```
Photo-Studio-Pricing-Simulator/
├── frontend/                          # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/                 # Admin dashboard components
│   │   │   │   ├── FormBuilderCanvas.tsx    # Visual node editor (React Flow)
│   │   │   │   ├── FormNodeViewPage.tsx     # Full-screen node view
│   │   │   │   ├── CategoryManager.tsx      # 3-tier category management
│   │   │   │   └── BlockEditModal.tsx       # Block editing modal
│   │   │   └── customer/              # Customer-facing components
│   │   │       └── ProductCategorySection.tsx
│   │   ├── pages/
│   │   │   ├── CustomerFormPageV3.tsx       # Main customer form (V3)
│   │   │   ├── AdminPage.tsx                # Admin dashboard
│   │   │   ├── FormBlockEditorPage.tsx      # Form builder page
│   │   │   └── LoginPage.tsx                # Authentication
│   │   ├── services/                  # Supabase API abstraction
│   │   │   ├── formBuilderService.ts        # Form CRUD + publish
│   │   │   ├── categoryService.ts           # Category operations
│   │   │   └── simulatorService.ts          # Customer data fetching
│   │   ├── types/                     # TypeScript definitions
│   │   │   ├── formBuilder.ts               # Form/block types
│   │   │   ├── category.ts                  # Category types
│   │   │   └── campaign.ts                  # Campaign types
│   │   ├── utils/
│   │   │   ├── errorReporter.ts             # Auto log collection
│   │   │   └── logger.ts                    # Logging utilities
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx              # Auth state management
│   │   └── lib/
│   │       └── supabase.ts                  # Supabase client config
│   └── package.json
│
├── backend/                           # Minimal Express.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── simulator.ts                 # Public endpoints
│   │   │   └── admin.ts                     # Protected endpoints
│   │   ├── middleware/
│   │   │   └── auth.ts                      # JWT validation
│   │   └── lib/
│   │       └── supabase.ts                  # Supabase client
│   └── package.json
│
├── supabase/
│   └── migrations/                    # Database migrations (22 files)
│       ├── 001_*.sql                        # Base tables
│       ├── 005_*.sql                        # ⚠️ CRITICAL: RLS policies
│       ├── 014_*.sql                        # Draft/published status
│       ├── 015_*.sql                        # Published blocks table
│       └── 016_*.sql                        # Atomic save function
│
├── .github/workflows/
│   ├── deploy.yml                     # Auto-deploy to GitHub Pages
│   └── auto-merge.yml                 # Auto-merge claude/* branches
│
├── .claude/                           # Development documentation
│   ├── DEVELOPMENT_GUIDELINES.md      # Japanese dev guidelines
│   ├── DEVELOPMENT_LOG.md             # Change history
│   ├── STATUS.md                      # Current status
│   └── QUICKSTART.md                  # Quick reference
│
├── scripts/
│   ├── diagnose.sql                   # DB diagnostics
│   └── setup-e2e-tests.sh             # E2E test setup
│
├── ARCHITECTURE.md                    # Architecture documentation
├── TROUBLESHOOTING.md                 # Common issues & solutions
├── README.md                          # Main readme
└── CLAUDE.md                          # This file
```

---

## Architecture

### Design Principles

1. **Supabase-First**: Most business logic lives in PostgreSQL (RLS, functions, triggers)
2. **Type Safety**: Strict TypeScript throughout
3. **Service Layer Pattern**: All Supabase calls abstracted into services
4. **Component Composition**: Functional components + hooks (no class components)
5. **Mobile-First**: All UIs prioritize smartphone display
6. **Progressive Disclosure**: Show form blocks step-by-step based on user answers

### Data Model

#### 3-Tier Category System

```
ShootingCategory (撮影カテゴリ)
  └── ProductCategory (商品カテゴリ)  [via shooting_product_associations]
        └── Item (アイテム)

Example:
七五三 (Shichigosan)
  ├── ヘアセット (Hair)
  │     ├─ 基本ヘアセット ¥5,000
  │     └─ 日本髪ヘアセット ¥8,000
  └── メイク (Makeup)
        ├─ ナチュラルメイク ¥3,000
        └─ フルメイク ¥5,000
```

**Key Tables**:
- `shooting_categories` - Top level (e.g., 七五三, 成人式)
- `product_categories` - Mid level (e.g., ヘア, メイク, 衣装)
- `items` - Bottom level (e.g., フルメイク ¥5,500)
- `shooting_product_associations` - Many-to-many relationship

#### Form Builder System

```
FormSchema (form_schemas)
  ├── status: 'draft' | 'published'
  ├── published_at: timestamp
  └── FormBlocks (form_blocks / published_blocks)
        ├── BlockType: 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference'
        ├── content: string
        ├── metadata: JSONB (flexible data)
        └── show_condition: JSONB (conditional logic)
```

**Draft/Published Workflow**:
1. Create form (status: 'draft')
2. Edit `form_blocks` (draft version)
3. Save draft (updates `form_blocks` only)
4. Publish → copies `form_blocks` → `published_blocks`, sets status: 'published'
5. Customers see `published_blocks` only
6. Continue editing draft without affecting live version

**Block Types**:
- `text` - Plain text content
- `heading` - Section headers
- `yes_no` - Binary conditional (Yes/No question)
- `choice` - Multiple choice with pricing
- `category_reference` - Link to product category

**Conditional Logic** (`show_condition`):
```typescript
{
  type: 'yes_no' | 'choice' | 'next',
  block_id: number,  // Parent block ID
  value: string      // Trigger value ('yes', 'no', choice value, or 'next')
}
```

### Authentication & Authorization

**Provider**: Supabase Auth

**Pattern**:
```typescript
// AuthContext wraps entire app
<AuthProvider>
  <Router>...</Router>
</AuthProvider>

// Components use useAuth hook
const { user, session, loading, signIn, signOut } = useAuth()

// Protected routes
useEffect(() => {
  if (!loading && !user) navigate('/login')
}, [user, loading])
```

**Row Level Security (RLS)**:
```sql
-- Pattern used across all tables:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Public read (for customers)
CREATE POLICY "table_select" ON table_name
  FOR SELECT TO authenticated, anon USING (true);

-- Authenticated-only mutations
CREATE POLICY "table_insert" ON table_name
  FOR INSERT TO authenticated WITH CHECK (true);
```

**⚠️ CRITICAL**: Migration `005_*.sql` contains RLS policies. Without it, admin features fail.

### State Management

**Pattern**: React Context + Local State (no Redux/Zustand)

**AuthContext** (`/contexts/AuthContext.tsx`):
- Provides user session across app
- Auto-refresh on session changes
- Handles sign in/out

**Component State**:
- Heavy use of `useState`, `useEffect`, `useMemo`, `useCallback`
- Local state for UI interactions
- Service layer for data fetching

---

## Development Workflows

### Local Development

```bash
# Frontend (Port 3000)
cd frontend
npm run dev

# Backend (Port 5000) - Optional, most logic in Supabase
cd backend
npm run dev
```

### Making Changes

#### 1. Read Before Writing

**NEVER propose changes to code you haven't read.**

```bash
# Always read files first
# Good: Read → Understand → Modify
# Bad: Guess → Modify
```

#### 2. Follow Service Pattern

All Supabase interactions go through service files:

```typescript
// services/formBuilderService.ts
export async function getFormSchemas(shopId: number): Promise<FormSchema[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order')

  if (error) throw error
  return data
}
```

**Services throw errors, components catch them**:

```typescript
// Component usage
try {
  setLoading(true)
  const forms = await getFormSchemas(shopId)
  setForms(forms)
} catch (err) {
  console.error('Failed to load:', err)
  alert(`読み込み失敗: ${getErrorMessage(err)}`)
} finally {
  setLoading(false)
}
```

#### 3. Error Handling Pattern

**Always use try-catch-finally**:

```typescript
const handleSave = async () => {
  try {
    setLoading(true)
    await saveFormSchema(data)
    alert('保存しました')
    await reloadData()  // Refresh after success
  } catch (err) {
    console.error('Save failed:', err)
    alert(`保存に失敗: ${getErrorMessage(err)}`)
  } finally {
    setLoading(false)  // Always reset loading state
  }
}
```

#### 4. TypeScript Strict Mode

Enabled globally with:
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `strict: true`

**Type Patterns**:
```typescript
// Discriminated unions
type BlockType = 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference'
type FormStatus = 'draft' | 'published'

// Extended types for joined data
interface ProductCategoryWithItems extends ProductCategory {
  items: Item[]
}

// Metadata as flexible JSONB
metadata: {
  product_category_id?: number
  display_mode?: 'expanded' | 'collapsed'
  choice_options?: ChoiceOption[]
  [key: string]: any  // Allow extension
}
```

### Git Workflow

#### Branch Strategy

```
main                                    # Production
  └── claude/feature-name-sessionId     # Claude Code branches
```

**Branch naming**:
- MUST start with `claude/`
- MUST end with session ID
- Example: `claude/add-claude-documentation-PhdeZ`

#### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Bug fix
refactor: Code refactoring (no behavior change)
docs: Documentation updates
style: Code style (formatting, no logic change)
test: Add/modify tests
chore: Build/config changes
debug: Add debug logs (remove before production)
```

**Examples**:
```bash
git commit -m "feat: フォームビルダーにchoiceブロックを追加"
git commit -m "fix: ブロック削除時の確認ダイアログ重複を修正"
git commit -m "docs: CLAUDE.mdにアーキテクチャ説明を追加"
```

#### Committing Changes

**Only commit when explicitly requested by the user.**

```bash
# 1. Check status and diff
git status
git diff

# 2. Stage relevant files
git add <files>

# 3. Commit with descriptive message
git commit -m "$(cat <<'EOF'
feat: Feature description

Additional context if needed
EOF
)"

# 4. Push to remote
git push -u origin claude/branch-name-sessionId
```

**⚠️ Important**:
- Push to branches starting with `claude/` only
- Use `git push -u origin <branch-name>`
- Retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s) if network errors
- NEVER push to `main` directly

#### Creating Pull Requests

```bash
# 1. Ensure changes are pushed
git push -u origin claude/branch-name

# 2. Create PR using gh CLI
gh pr create --title "PR Title" --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Test Plan
- [ ] Tested locally
- [ ] Build succeeds
- [ ] No console errors
EOF
)"
```

**Auto-merge**: PRs on `claude/*` branches are auto-merged by GitHub Actions.

### CI/CD Pipeline

#### deploy.yml - GitHub Pages Deployment

**Triggers**:
- Push to `main`
- Manual workflow dispatch

**Steps**:
1. Checkout code
2. Install Node.js 18
3. Build frontend for multiple tenants:
   - `npm run build:y_sogo` → `deploy/y_sogo/simulation/`
   - `npm run build:c_sogo` → `deploy/c_sogo/simulation/`
4. Create root `index.html`
5. Deploy to GitHub Pages

#### auto-merge.yml - Auto-merge Claude Branches

**Triggers**: Push to `claude/**`

**Features**:
- Auto-create PR
- Retry logic with exponential backoff (4 retries)
- Wait for mergeable status (5 attempts × 5s)
- Auto-merge with branch deletion

---

## Key Conventions

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `FormBuilderCanvas.tsx` |
| Services | camelCase | `formBuilderService.ts` |
| Types | camelCase | `formBuilder.ts` |
| Utils | camelCase | `errorReporter.ts` |
| Database tables | snake_case | `form_schemas`, `product_categories` |
| Database columns | snake_case | `shop_id`, `created_at` |

### Code Organization

#### Service Layer Pattern

Each service exports CRUD + utility functions:

```typescript
// Pattern: get*, create*, update*, delete*, <custom>*
export async function getFormSchemas(shopId: number): Promise<FormSchema[]>
export async function createFormSchema(data: CreateFormSchema): Promise<FormSchema>
export async function updateFormSchema(id: number, data: Partial<FormSchema>): Promise<FormSchema>
export async function deleteFormSchema(id: number): Promise<void>
export async function publishFormSchema(id: number): Promise<FormSchema>
```

#### Component Pattern

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { serviceFunction } from '../services/serviceName'

// 2. Type definitions (if needed)
interface Props {
  // ...
}

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // 4. State
  const [data, setData] = useState<DataType | null>(null)
  const [loading, setLoading] = useState(false)

  // 5. Effects
  useEffect(() => {
    loadData()
  }, [])

  // 6. Handlers
  const handleAction = async () => {
    try {
      setLoading(true)
      await serviceFunction()
      alert('成功しました')
    } catch (err) {
      console.error('Error:', err)
      alert(`失敗: ${getErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Styling Conventions

**Tailwind CSS** with custom design system:

```typescript
// Custom colors in tailwind.config.js
colors: {
  brand: { ... },      // 横浜そごう写真館 blue
  secondary: { ... },  // Gold accents
  accent: { ... },     // Accent colors
  neutral: { ... },    // Gray scale
  background: { ... }  // Soft ivory
}

// Japanese fonts
fontFamily: {
  'mincho': ['"Yu Mincho"', ...],   // Japanese serif
  'gothic': ['"Yu Gothic"', ...]    // Japanese sans-serif
}
```

**Common patterns**:
```jsx
// Buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>

// Cards
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Content */}
</div>

// Mobile-first responsive
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Responsive width */}
</div>
```

### Important Development Rules

#### ✅ DO

- **Read files before editing** - Always use Read tool first
- **Mobile-first design** - Test on smartphone viewport
- **Progressive disclosure** - Show blocks step-by-step
- **Tax-inclusive pricing** - Display only tax-included prices (税込)
- **Error tracking** - Use `console.error()` for automatic logging
- **TypeScript strict mode** - Fix all type errors
- **Service layer** - Abstract all Supabase calls
- **Loading states** - Always manage loading UI
- **Error messages** - User-friendly Japanese messages

#### ❌ DON'T

- **Tax-exclusive pricing** - Never show tax-excluded prices
- **Desktop-first design** - Don't prioritize desktop
- **Debug logs in production** - Remove before deploying
- **Direct Supabase calls** - Use service layer instead
- **Guess file contents** - Always read first
- **Skip error handling** - Always use try-catch
- **Ignore TypeScript errors** - Fix all errors before committing

---

## Common Tasks

### Add a New Block Type

**Files to modify**:
1. `/types/formBuilder.ts` - Add to `BlockType` union
2. `/components/admin/FormBuilderCanvas.tsx` - Add toolbar button
3. `/components/admin/FormBlockNode.tsx` - Implement rendering
4. `/components/admin/BlockEditModal.tsx` - Add editing UI
5. `/pages/CustomerFormPageV3.tsx` - Add customer-facing rendering

**Example**:
```typescript
// 1. types/formBuilder.ts
type BlockType = 'text' | 'heading' | 'yes_no' | 'choice' | 'category_reference' | 'new_type'

// 2. FormBuilderCanvas.tsx - Add toolbar button
<button onClick={() => addBlock('new_type', 'New Block Content')}>
  Add New Type
</button>

// 3. FormBlockNode.tsx - Render in node view
case 'new_type':
  return <div className="font-bold">{content}</div>

// 4. BlockEditModal.tsx - Add editing form
{block.block_type === 'new_type' && (
  <div>
    <label>Special Field</label>
    <input {...} />
  </div>
)}

// 5. CustomerFormPageV3.tsx - Render for customers
case 'new_type':
  return <div className="text-lg">{block.content}</div>
```

### Add a Database Migration

**Steps**:
1. Create new file: `supabase/migrations/023_descriptive_name.sql`
2. Write SQL:
```sql
-- 023_add_new_column.sql
ALTER TABLE form_schemas
ADD COLUMN new_column VARCHAR(255);

CREATE INDEX idx_form_schemas_new_column ON form_schemas(new_column);

-- Add comment for documentation
COMMENT ON COLUMN form_schemas.new_column IS 'Description of the column';
```
3. Test in development Supabase project (SQL Editor)
4. Update migration README: `supabase/migrations/README.md`
5. Apply to production Supabase project

**⚠️ Important**:
- Migrations are applied in numeric order
- Use descriptive names
- Test before production
- Update README.md with migration details

### Add a New Service Function

**Pattern**:
```typescript
// services/formBuilderService.ts

/**
 * Get form schemas by shooting category
 * @param shopId Shop ID
 * @param shootingCategoryId Shooting category ID
 * @returns Array of form schemas
 * @throws Supabase error if query fails
 */
export async function getFormsBySho otingCategory(
  shopId: number,
  shootingCategoryId: number
): Promise<FormSchema[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shooting_category_id', shootingCategoryId)
    .eq('is_active', true)
    .order('sort_order')

  if (error) throw error
  return data || []
}
```

**Best practices**:
- JSDoc comments with `@param`, `@returns`, `@throws`
- Typed parameters and return values
- Throw errors (let caller handle)
- Return empty array instead of null for lists
- Use `.single()` for single records, handle `PGRST116` (not found) error

### Debug with Error Reporter

**Automatic Logging**:
All `console.log/warn/error/debug` calls are intercepted and stored.

**Manual Download**:
```javascript
// In browser console
window.errorReporter.getLogs()           // View all logs
window.errorReporter.downloadReport()    // Download JSON report
window.errorReporter.clearLogs()         // Clear all logs
```

**Auto-reporting**:
When `console.error()` is called, a report is automatically generated.

**Development**:
Error reports shown in console (table format).

**Production**:
Errors saved to `localStorage` (last 10 reports).

### Run Tests

```bash
cd frontend

# Watch mode
npm test

# UI mode (recommended)
npm run test:ui

# Single run
npm run test:run

# Coverage
npm run test:coverage
```

**Test files**:
- `/utils/formBuilderLogic.test.ts`
- `/utils/sectionLogic.test.ts`
- `/utils/conditionalRuleEngine.test.ts`
- `/services/formBuilderService.test.ts`

---

## Important Gotchas

### 1. Migration 005 is CRITICAL

**Symptom**: Admin features fail with permission errors

**Cause**: RLS policies not applied

**Solution**:
```sql
-- Run in Supabase SQL Editor
-- Check if policies exist:
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- If missing, apply migration 005
-- Copy contents of: supabase/migrations/005_*.sql
```

### 2. Draft vs Published Confusion

**Remember**:
- Editing ONLY modifies `form_blocks` (draft)
- Customers see `published_blocks` (separate table)
- Must click "Publish" to copy draft → published

**Check status**:
```sql
SELECT id, name, status, published_at FROM form_schemas;
```

### 3. Conditional Block Logic

**Progressive Disclosure**:
Blocks with `show_condition` appear ONLY when condition is met.

**Example**:
```typescript
// Block 2 appears only when Block 1 answer is "yes"
{
  block_type: 'text',
  content: '追加オプションを選択してください',
  show_condition: {
    type: 'yes_no',
    block_id: 1,
    value: 'yes'
  }
}
```

**Gotcha**: Blocks appear instantly when condition becomes true. Test all paths.

### 4. Multi-Tenant Deployment

**Two separate builds**:
- `npm run build:y_sogo` - Yokohama SOGO (VITE_SHOP_ID=1)
- `npm run build:c_sogo` - Chiba SOGO (VITE_SHOP_ID=2)

**Different base paths**:
- `/y_sogo/simulation/`
- `/c_sogo/simulation/`

**GitHub Pages routing**:
Uses `404.html` redirect + `sessionStorage` for SPA routing.

### 5. Tax-Inclusive Pricing Only

**ALWAYS**:
```
✅ 32,780円（税込）
✅ ¥32,780
```

**NEVER**:
```
❌ 29,800円（税抜）
❌ 32,780円（税込29,800円）
```

### 6. Auto-merge Timing

**GitHub Actions auto-merge** can take 1-3 minutes.

**Check status**:
```bash
gh pr list --head claude/your-branch-name
gh run list --workflow=auto-merge.yml
```

**If stuck**:
- Wait 5 minutes
- Check GitHub Actions logs
- Retry logic handles API errors (max 4 retries)

### 7. Supabase Service Role Key

**NEVER** expose in frontend:
- Service role key bypasses RLS
- Only use in backend
- Frontend uses `anon` key only

**Check**:
```typescript
// ❌ BAD - In frontend
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ GOOD - In frontend
const supabase = createClient(url, ANON_KEY)

// ✅ GOOD - In backend only
const supabase = createClient(url, SERVICE_ROLE_KEY)
```

---

## Testing & Deployment

### Local Testing Checklist

Before committing:
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] No console errors in browser
- [ ] Test on mobile viewport (DevTools responsive mode)
- [ ] Test all conditional branches (if applicable)
- [ ] Pricing calculations are correct
- [ ] Error handling works (disconnect network and retry)

### Build Process

```bash
cd frontend

# Production build
npm run build

# Multi-tenant builds (for GitHub Pages)
npm run build:y_sogo  # Yokohama SOGO
npm run build:c_sogo  # Chiba SOGO

# Check build output
ls -la dist/
```

### Deployment

**Automatic** (via GitHub Actions):
1. Push to `claude/*` branch
2. Auto-merge to `main` (via `auto-merge.yml`)
3. Auto-deploy to GitHub Pages (via `deploy.yml`)
4. Live in ~5 minutes

**Manual** (if needed):
```bash
# Trigger deploy workflow
gh workflow run deploy.yml
```

**Live URLs**:
- Yokohama SOGO: `https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/y_sogo/simulation/`
- Chiba SOGO: `https://ykmp-dev.github.io/Photo-Studio-Pricing-Simulator/c_sogo/simulation/`

### Verify Deployment

1. Check GitHub Actions: `https://github.com/ykmp-dev/Photo-Studio-Pricing-Simulator/actions`
2. Visit live URL
3. Test authentication (login)
4. Test form builder (admin)
5. Test customer form (published forms only)

---

## Reference Documentation

### Primary Documentation

| File | Purpose | When to Read |
|------|---------|-------------|
| **CLAUDE.md** | AI assistant guide (this file) | First time, before major changes |
| **README.md** | User-facing documentation | Understanding features |
| **ARCHITECTURE.md** | Detailed architecture | Deep dive into design |
| **TROUBLESHOOTING.md** | Common issues & solutions | When stuck |
| **.claude/DEVELOPMENT_GUIDELINES.md** | Japanese dev guidelines | Understanding conventions |
| **.claude/DEVELOPMENT_LOG.md** | Change history | Catching up on recent changes |

### Quick Reference

**Common commands**:
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm test                 # Run tests

# Git
git log --oneline -10    # Recent commits
git status               # Current state
git diff                 # Unstaged changes

# GitHub CLI
gh pr list               # List PRs
gh pr create             # Create PR
gh run list              # List workflow runs
```

**Useful paths**:
```
/frontend/src/services/         # All Supabase interactions
/frontend/src/types/            # TypeScript definitions
/frontend/src/components/admin/ # Admin components
/frontend/src/pages/            # Page components
/supabase/migrations/           # Database schema
```

**Key files to understand**:
1. `/frontend/src/pages/FormNodeViewPage.tsx` - Form builder UI
2. `/frontend/src/components/admin/FormBuilderCanvas.tsx` - Visual editor
3. `/frontend/src/services/formBuilderService.ts` - Form operations
4. `/frontend/src/pages/CustomerFormPageV3.tsx` - Customer-facing form
5. `/frontend/src/utils/errorReporter.ts` - Error tracking

### External Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Flow Docs**: https://reactflow.dev/docs
- **Vite Docs**: https://vitejs.dev/guide
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs

### Getting Help

**Troubleshooting workflow**:
1. Check `TROUBLESHOOTING.md`
2. Download error report: `window.errorReporter.downloadReport()`
3. Check Supabase Dashboard → SQL Editor for DB issues
4. Review GitHub Actions logs for deployment issues
5. Check migration status: `scripts/diagnose.sql`

**Before asking for help**:
- [ ] Read relevant documentation
- [ ] Check recent commits (`git log`)
- [ ] Verify environment variables
- [ ] Test in clean browser (incognito mode)
- [ ] Check Supabase Dashboard for RLS issues

---

## Summary: Quick Orientation for New Claude Sessions

### First 5 Minutes

1. **Read this file** (CLAUDE.md)
2. **Check recent history**: `git log --oneline -20`
3. **Read development log**: `.claude/DEVELOPMENT_LOG.md`
4. **Verify build**: `cd frontend && npm run build`
5. **Check current branch**: `git status`

### Key Things to Remember

1. **Always read before writing** - Use Read tool first
2. **Service layer pattern** - All Supabase → services/*.ts
3. **Error handling** - Always try-catch-finally
4. **Mobile-first** - Test responsive design
5. **Tax-inclusive only** - Never show tax-excluded prices
6. **Draft/Published** - Editing ≠ Publishing
7. **RLS policies critical** - Migration 005 must be applied
8. **Type safety** - Fix all TypeScript errors
9. **Commit only when asked** - Don't be proactive
10. **Claude branches only** - Never push to main directly

### Common Pitfalls

1. **Forgetting to read files** before editing
2. **Skipping error handling** in async functions
3. **Not testing mobile viewport**
4. **Showing tax-excluded prices**
5. **Direct Supabase calls** instead of using services
6. **Assuming migration state** without checking
7. **Editing without understanding** existing patterns

### Your Role

You are an AI assistant helping with **software engineering tasks**:
- Implement features as requested
- Fix bugs systematically
- Refactor code when asked
- Explain code behavior
- Help with troubleshooting

**You should NOT**:
- Make unsolicited improvements
- Add features not requested
- Over-engineer solutions
- Ignore user conventions
- Assume you know better than existing code

---

**Last Updated**: 2025-12-26
**Version**: 1.0.0
**Maintained By**: Claude Code Sessions

For questions or updates, modify this file and commit with:
```bash
git commit -m "docs: Update CLAUDE.md with [description]"
```
