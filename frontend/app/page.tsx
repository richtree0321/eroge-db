// ========================================
// トップページ: ゲーム一覧を表示
// ========================================

import { Pool } from "pg";
import { SearchVN } from "@/lib/types";
import Link from "next/link";

// データベース接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ========================================
// ゲームカードコンポーネント（インライン定義）
// ========================================
function GameCard({ game }: { game: SearchVN }) {
  return (
    <Link href={`/game/${game.id}`} className="block h-full">
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* 画像とテキストを横並び */}
        <div className="flex gap-4">
          {/* 画像エリア */}
          <div className="w-20 h-28 flex-shrink-0">
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={game.title}
                className="w-full h-full object-cover rounded shadow-sm"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>

          {/* テキストエリア */}
          <div className="flex-grow flex flex-col justify-between min-w-0">
            {/* タイトル (日本語優先) */}
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {game.title_ja || game.title}
            </h2>

            {/* 評価スコア */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">評価:</span>
              <span className="text-xl font-bold text-blue-600">
                {game.rating ? Number(game.rating).toFixed(1) : "-"}
              </span>
              {game.votecount && (
                <span className="text-xs text-gray-400">
                  ({Number(game.votecount).toLocaleString()}票)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ========================================
// メインのページコンポーネント
// ========================================
export default async function Home() {
  // データベースからデータを取得
  const client = await pool.connect();

  // search_vns テーブルから取得（評価順）
  const result = await client.query<SearchVN>(
    `SELECT id, title, title_ja, rating, votecount, cover_url 
     FROM public.search_vns 
     WHERE rating IS NOT NULL
     ORDER BY rating DESC NULLS LAST 
     LIMIT 100`
  );

  const games = result.rows;
  client.release();

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🎮 エロゲDB</h1>
          <div className="text-sm text-gray-500">
            {games.length.toLocaleString()} 件表示中 / 36,698 件
          </div>
        </div>

        {/* ソートタブ（デモ用、機能は後で実装） */}
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            評価順
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
            人気順
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
            新着順
          </button>
        </div>

        {/* ゲームリスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}
