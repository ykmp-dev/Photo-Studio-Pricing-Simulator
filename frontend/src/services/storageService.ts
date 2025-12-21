import { supabase } from '../lib/supabase'

/**
 * 画像ファイルをSupabase Storageにアップロード
 * @param file アップロードするファイル
 * @param bucket バケット名（デフォルト: 'images'）
 * @param folder フォルダ名（デフォルト: 'shooting-categories'）
 * @returns アップロードされた画像の公開URL
 */
export async function uploadImage(
  file: File,
  bucket: string = 'images',
  folder: string = 'shooting-categories'
): Promise<string> {
  // ファイル名を生成（タイムスタンプ + ランダム文字列 + 元のファイル名）
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${timestamp}-${randomStr}.${ext}`

  // Supabase Storageにアップロード
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    console.error('画像アップロードエラー:', error)
    throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
  }

  // 公開URLを取得
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path)

  return publicUrl
}

/**
 * Supabase Storageから画像を削除
 * @param url 削除する画像のURL
 * @param bucket バケット名（デフォルト: 'images'）
 */
export async function deleteImage(url: string, bucket: string = 'images'): Promise<void> {
  // URLからパスを抽出
  const urlObj = new URL(url)
  const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)

  if (!pathMatch) {
    throw new Error('無効な画像URLです')
  }

  const filePath = pathMatch[1]

  // Supabase Storageから削除
  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    console.error('画像削除エラー:', error)
    throw new Error(`画像の削除に失敗しました: ${error.message}`)
  }
}

/**
 * 画像ファイルのバリデーション
 * @param file バリデーションするファイル
 * @param maxSizeMB 最大サイズ（MB）デフォルト: 5MB
 * @returns バリデーション結果
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  // ファイルタイプチェック
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '画像ファイル（JPEG、PNG、GIF、WebP）のみアップロード可能です',
    }
  }

  // ファイルサイズチェック
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `ファイルサイズは${maxSizeMB}MB以下にしてください`,
    }
  }

  return { valid: true }
}
