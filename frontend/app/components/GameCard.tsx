import { SearchVN } from "@/lib/types";
import Link from "next/link";

// GameCardコンポーネントのプロパティ（引数）の型定義
// SearchVN 型 (search_vns テーブルの構造) を使用
interface GameCardProps {
  game: SearchVN;
}

// GameCardコンポーネント本体
export default function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/game/${game.id}`} className="block h-full">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* フレックスボックスで画像とテキストを横並びにする */}
        <div className="flex gap-6">
          {/* 画像エリア */}
          <div className="w-24 h-32 flex-shrink-0">
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
          <div className="flex-grow flex flex-col justify-between">
            {/* タイトル表示 (日本語優先) */}
            <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
              {game.title_ja || game.title}
            </h2>

            {/* 発売日表示 (null対応) */}
            {game.released && (
              <p className="text-sm text-gray-500 mt-1">
                {new Date(game.released).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}

            {/* タグ表示 (現在はIDsのみなので一時的に非表示) */}
            {/* 
            {game.tag_ids && game.tag_ids.length > 0 && (
               <div className="flex flex-wrap gap-1 mt-2">...</div>
            )} 
            */}

            {/* スコアと投票数 */}
            <div className="mt-auto pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">スコア:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {game.rating ? Number(game.rating).toFixed(1) : "-"}
                </span>
              </div>

              {game.votecount && (
                <p className="text-xs text-gray-400 mt-1">
                  {Number(game.votecount).toLocaleString()}票
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
