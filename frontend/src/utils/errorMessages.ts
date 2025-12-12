// エラーメッセージをユーザーフレンドリーな日本語に変換

interface SupabaseError {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function getErrorMessage(error: unknown): string {
  if (!error) return '不明なエラーが発生しました'

  const err = error as SupabaseError

  // PostgreSQL エラーコード
  // https://www.postgresql.org/docs/current/errcodes-appendix.html

  // 23505: unique_violation (一意制約違反)
  if (err.code === '23505' || err.message?.includes('duplicate key')) {
    if (err.message?.includes('shop_id, name')) {
      return '入力されたキー名は既に存在しています。別の名前を使用してください。'
    }
    return '入力されたデータは既に存在しています。'
  }

  // 23503: foreign_key_violation (外部キー制約違反)
  if (err.code === '23503') {
    return '関連するデータが存在しないため、操作できません。'
  }

  // 23502: not_null_violation (NOT NULL制約違反)
  if (err.code === '23502') {
    return '必須項目が入力されていません。'
  }

  // 23514: check_violation (CHECK制約違反)
  if (err.code === '23514') {
    return '入力された値が不正です。'
  }

  // 42501: insufficient_privilege (権限不足)
  if (err.code === '42501') {
    return '操作する権限がありません。ログインし直してください。'
  }

  // 42P01: undefined_table (テーブルが存在しない)
  if (err.code === '42P01') {
    return 'データベースの設定が完了していません。マイグレーションを実行してください。'
  }

  // ネットワークエラー
  if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
  }

  // タイムアウト
  if (err.message?.includes('timeout')) {
    return '処理がタイムアウトしました。もう一度お試しください。'
  }

  // デフォルトメッセージ（詳細を含む）
  if (err.message) {
    return `エラー: ${err.message}`
  }

  return '予期しないエラーが発生しました。'
}

// 成功メッセージのヘルパー
export function getSuccessMessage(action: 'create' | 'update' | 'delete', itemType: string): string {
  const actionText = {
    create: '作成',
    update: '更新',
    delete: '削除',
  }[action]

  return `${itemType}を${actionText}しました`
}
