// タグの英語→日本語翻訳辞書
// VNDBの主要なタグを日本語に翻訳するための辞書ファイル

/**
 * タグ翻訳マップ
 * キー: 英語のタグ名
 * 値: 日本語のタグ名
 */
const TAG_TRANSLATIONS: Record<string, string> = {
  // ジャンル・カテゴリ
  'ADV': 'アドベンチャー',
  'AVG': 'アドベンチャー',
  'Horror': 'ホラー',
  'Romance': 'ロマンス',
  'Comedy': 'コメディ',
  'Drama': 'ドラマ',
  'Fantasy': 'ファンタジー',
  'Sci-fi': 'SF',
  'Mystery': 'ミステリー',
  'Thriller': 'スリラー',
  'Action': 'アクション',
  
  // 主人公
  'Male Protagonist': '男性主人公',
  'Female Protagonist': '女性主人公',
  
  // 設定
  'School Life': '学校生活',
  'High School': '高校',
  'School': '学校',
  'College': '大学',
  'Modern Day': '現代',
  'Future': '未来',
  'Past': '過去',
  'Japan': '日本',
  'Slice of Life': '日常系',
  
  // メカニクス
  'Multiple Endings': 'マルチエンディング',
  'Choices': '選択肢',
  'Branching Plot': '分岐シナリオ',
  'Linear Plot': '一本道',
  'Point and Click': 'ポイント&クリック',
  
  // コンテンツ警告
  'Sexual Content': '性的コンテンツ',
  'Eroge': 'エロゲ',
  'No Sexual Content': '性的コンテンツなし',
  'Violence': '暴力表現',
  'Gore': 'グロ表現',
  
  // その他人気タグ
  'Nakige': '泣きゲー',
  'Utsuge': '鬱ゲー',
  'Kinetic Novel': 'キネティックノベル',
  'Visual Novel': 'ビジュアルノベル',
  'RPG': 'RPG',
  'Simulation': 'シミュレーション',
  'Strategy': 'ストラテジー',
  'Puzzle': 'パズル',
  
  // テーマ
  'Time Travel': 'タイムトラベル',
  'Supernatural': '超常現象',
  'Magic': '魔法',
  'War': '戦争',
  'Post-apocalyptic': 'ポストアポカリプス',
  'Cyberpunk': 'サイバーパンク',
  'Steampunk': 'スチームパンク',
  
  // キャラクター属性
  'Tsundere': 'ツンデレ',
  'Yandere': 'ヤンデレ',
  'Kuudere': 'クーデレ',
  'Childhood Friend': '幼馴染',
  'Maid': 'メイド',
  'Teacher': '教師',
  'Student': '学生',
};

/**
 * 英語タグを日本語に翻訳する関数
 * @param englishTag - 英語のタグ名
 * @returns 日本語のタグ名。翻訳がない場合は元の英語タグを返す
 */
export function translateTag(englishTag: string): string {
  return TAG_TRANSLATIONS[englishTag] || englishTag;
}

/**
 * 翻訳が存在するかチェックする関数
 * @param englishTag - 英語のタグ名
 * @returns 翻訳が存在する場合は true
 */
export function hasTranslation(englishTag: string): boolean {
  return englishTag in TAG_TRANSLATIONS;
}
