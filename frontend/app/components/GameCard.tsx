// ========================================
// GameCardコンポーネント: ゲーム一覧で使用するカード
// ========================================
//
// このコンポーネントはトップページのゲーム一覧で使用されます。
// search_vns テーブルから取得したデータを表示します。
// ========================================

import { SearchVN } from "@/lib/types"; // 型定義をインポート
import Link from "next/link"; // Next.js のリンクコンポーネント

// GameCardコンポーネントのプロパティ（引数）の型定義
interface GameCardProps {
  game: SearchVN; // search_vns テーブルの1行分のデータ
}

// GameCardコンポーネント本体
export default function GameCard({ game }: GameCardProps) {
  return (
    // クリック可能なリンク（詳細ページへ遷移）
    <Link href={`/game/${game.id}`} className="block h-full">
      {/* カード本体：白背景、角丸、シャドウ、ホバー効果 */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* フレックスボックスで画像とテキストを横並び */}
        <div className="flex gap-4">
          {/* 画像エリア：固定サイズ（伸縮しない） */}
          <div className="w-20 h-28 flex-shrink-0">
            {/* 画像URLがある場合は画像を表示 */}
            {game.cover_url ? (
              <img
                src={game.cover_url}
                alt={game.title}
                className="w-full h-full object-cover rounded shadow-sm"
              />
            ) : (
              // 画像がない場合はプレースホルダーを表示
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>

          {/* テキストエリア：残りのスペースを使用 */}
          <div className="flex-grow flex flex-col justify-between min-w-0">
            {/* タイトル（日本語優先、なければ英語タイトル） */}
            {/* truncate で長いタイトルは省略記号（...）で表示 */}
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {game.title_ja || game.title}
            </h2>

            {/* 評価スコアと投票数 */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">評価:</span>
              {/* スコアを1桁小数で表示、null の場合は "-" */}
              <span className="text-xl font-bold text-blue-600">
                {game.rating ? Number(game.rating).toFixed(1) : "-"}
              </span>
              {/* 投票数がある場合のみ表示 */}
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
