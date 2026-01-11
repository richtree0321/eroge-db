// ========================================
// 型定義ファイル: データベースのテーブル構造を TypeScript で表現
// ========================================

// ----------------------------------------
// SearchVN型: search_vns テーブルに対応（爆速検索用）
// ----------------------------------------
export interface SearchVN {
  id: string; // VN ID (例: "v11")
  title: string; // 英語タイトル
  title_ja: string | null; // 日本語タイトル
  released: string | null; // 発売日 (YYYY-MM-DD形式)
  rating: number | null; // 評価点 (0-100)
  votecount: number | null; // 投票数
  tag_ids: number[]; // タグIDの配列 (GINインデックス用)
  cover_url: string | null; // パッケージ画像URL
  display: object; // 一覧表示用の追加データ (JSONB)
}

// ----------------------------------------
// Tag型: タグ1つ分のデータ構造
// ----------------------------------------
export interface Tag {
  name: string; // 英語タグ名
  name_ja?: string; // 日本語タグ名
  rating: number; // 関連度スコア
}

// ----------------------------------------
// Character型: キャラクター情報
// ----------------------------------------
export interface Character {
  id: string; // キャラID (例: "c123")
  name: string; // 名前
  role: string; // 役割 (main, primary, side, appears)
  image_url: string | null; // 立ち絵・顔グラ
  gender: string | null; // 性別
}

// ----------------------------------------
// Staff型: スタッフ・声優情報
// ----------------------------------------
export interface Staff {
  id: number; // スタッフAlias ID
  name: string; // 名前
  role: string; // 役割 (scenario, art, music, voice, etc.)
  note: string | null; // 備考 (担当キャラ名など)
}

// ----------------------------------------
// VisualNovel型: 詳細ページ用 (vndbスキーマ直接取得)
// ----------------------------------------
export interface VisualNovel {
  id: string;
  title: string;
  title_ja: string | null;
  rating: number | null;
  votecount: number | null;
  description: string | null;
  cover_url: string | null;
  tags: Tag[];
  screenshots: { url: string }[];
  characters: Character[]; // 新規追加
  staff: Staff[]; // 新規追加
}
