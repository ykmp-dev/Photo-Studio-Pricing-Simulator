/**
 * 技術用語を非エンジニア向けの自然な日本語に変換
 */

export const formSectionLabels: Record<string, string> = {
  trigger: '📸 最初に選ぶ項目',
  conditional: '👗 条件で表示',
  common_final: '📚 いつも表示'
}

export const formSectionDescriptions: Record<string, string> = {
  trigger: '撮影コース、撮影場所など、お客様が最初に選ぶ項目',
  conditional: 'スタジオ撮影を選んだ時だけ表示するヘアメイクなど',
  common_final: 'データ納品、アルバム追加など、どのコースでも選べる追加オプション'
}

export const productTypeLabels: Record<string, string> = {
  plan: '◉ 1つ選ぶ（丸ボタン）',
  option_single: '▼ 1つ選ぶ（プルダウン）',
  option_multi: '☑ 複数選べる（チェックボックス）'
}

export const productTypeDescriptions: Record<string, string> = {
  plan: 'コース選択など、複数の選択肢から1つだけ選ぶ場合',
  option_single: '選択肢が多い場合、省スペースで表示',
  option_multi: '衣装追加、データ納品など、複数選択可能な追加オプション'
}
