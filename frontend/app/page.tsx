// ========================================
// トップページ: ゲーム一覧を表示
// ========================================

import { pool } from "@/lib/db"; // 共通化されたDBプールをインポート
import { SearchVN } from "@/lib/types"; // 検索結果の型定義をインポート
import GameCard from "@/app/components/GameCard"; // GameCardコンポーネントをインポート（共通化）

// ========================================
// メインのページコンポーネント
// ========================================
export default async function Home() {
  // データベースからコネクションを取得
  const client = await pool.connect();

  try {
    // ----------------------------------------
    // 1. ゲームデータを取得（評価順トップ100）
    // ----------------------------------------
    // search_vns テーブルから取得（評価順）
    const result = await client.query<SearchVN>(
      `SELECT id, title, title_ja, rating, votecount, cover_url 
       FROM public.search_vns 
       WHERE rating IS NOT NULL
       ORDER BY rating DESC NULLS LAST 
       LIMIT 100`
    );
    const games = result.rows; // 取得したゲームデータの配列

    // ----------------------------------------
    // 2. 総件数を取得（動的に表示するため）
    // ----------------------------------------
    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM public.search_vns`
    );
    // COUNT の結果は文字列で返るので数値に変換
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // ----------------------------------------
    // ページ描画（JSX を返す）
    // ----------------------------------------
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <main className="max-w-7xl mx-auto">
          {/* ヘッダー部分：タイトルと件数表示 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">🎮 エロゲDB</h1>
            <div className="text-sm text-gray-500">
              {/* 表示中の件数 / 全体の件数を動的に表示 */}
              {games.length.toLocaleString()} 件表示中 /{" "}
              {totalCount.toLocaleString()} 件
            </div>
          </div>

          {/* ソートタブ（デモ用、機能は後で実装） */}
          <div className="flex gap-2 mb-6">
            {/* 現在選択中のタブ（青色） */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
              評価順
            </button>
            {/* 未選択のタブ（グレー） */}
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
              人気順
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
              新着順
            </button>
          </div>

          {/* ゲームリスト：レスポンシブなグリッドレイアウト */}
          {/* grid-cols-1: モバイルで1列、md:2列、lg:3列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* games 配列をループして GameCard を表示 */}
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </main>
      </div>
    );
  } finally {
    // ----------------------------------------
    // 必ずコネクションを解放する（try/finally パターン）
    // これにより例外が発生しても接続リークを防止できる
    // ----------------------------------------
    client.release();
  }
}
