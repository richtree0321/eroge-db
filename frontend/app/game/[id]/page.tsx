// ========================================
// ゲーム詳細ページ - vndb スキーマから直接取得
// ========================================

import { Pool } from "pg";
import Link from "next/link";
import { Character, Staff } from "@/lib/types"; // 追加

// データベース接続プール
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ページの引数型
type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await pool.connect();

  try {
    // 1. 基本情報を取得 (vndb.vn テーブル)
    const vnResult = await client.query(
      `
      SELECT 
        v.id,
        v.c_rating::numeric / 10 as rating,
        v.c_votecount as votecount,
        v.description,
        v.c_image,
        (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = v.olang LIMIT 1) as title,
        (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = 'ja' LIMIT 1) as title_ja
      FROM vndb.vn v
      WHERE v.id = $1
    `,
      [id]
    );

    if (vnResult.rows.length === 0) {
      client.release();
      return (
        <div className="min-h-screen p-8 bg-gray-50">
          <main className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-red-600">
              ゲームが見つかりませんでした
            </h1>
            <p className="mt-4">ID: {id}</p>
            <Link
              href="/"
              className="text-blue-600 hover:underline mt-4 inline-block"
            >
              ← トップページに戻る
            </Link>
          </main>
        </div>
      );
    }

    const game = vnResult.rows[0];

    // 2. 画像URLを構築 (バケット = ID % 100)
    const coverUrl = game.c_image
      ? (() => {
          const numPart = game.c_image.substring(2);
          const bucket = (parseInt(numPart, 10) % 100)
            .toString()
            .padStart(2, "0");
          return `https://s2.vndb.org/cv/${bucket}/${numPart}.jpg`;
        })()
      : null;

    // 3. タグ情報を取得
    const tagsResult = await client.query(
      `
      SELECT DISTINCT t.name, t.id
      FROM vndb.tags t
      JOIN vndb.tags_vn tv ON t.id = tv.tag
      WHERE tv.vid = $1 AND tv.vote > 0 AND NOT tv.ignore
      LIMIT 20
    `,
      [id]
    );
    const tags = tagsResult.rows;

    // 4. スクリーンショットを取得
    const screenshotsResult = await client.query(
      `
      SELECT i.id
      FROM vndb.images i
      JOIN vndb.vn_screenshots vs ON i.id = vs.scr
      WHERE vs.id = $1
      LIMIT 12 -- 少し増やしました
    `,
      [id]
    );
    const screenshots = screenshotsResult.rows.map((ss) => {
      const numPart = ss.id.substring(2);
      const bucket = (parseInt(numPart, 10) % 100).toString().padStart(2, "0");
      return { url: `https://s2.vndb.org/sf/${bucket}/${numPart}.jpg` };
    });

    // 5. キャラクター情報を取得
    const charsResult = await client.query<Character>(
      `
      SELECT 
        c.id, 
        COALESCE(cn.name, (SELECT name FROM vndb.chars_names WHERE id = c.id LIMIT 1)) as name,
        cv.role, 
        c.image as image_url,
        c.gender
      FROM vndb.chars_vns cv
      JOIN vndb.chars c ON cv.id = c.id
      LEFT JOIN vndb.chars_names cn ON c.id = cn.id AND cn.lang = 'ja'
      WHERE cv.vid = $1
      ORDER BY 
          CASE cv.role 
              WHEN 'main' THEN 1 
              WHEN 'primary' THEN 2 
              WHEN 'side' THEN 3 
              ELSE 4 
          END, 
          c.id
      LIMIT 24
      `,
      [id]
    );

    const characters = charsResult.rows.map((char) => ({
      ...char,
      image_url: char.image_url
        ? (() => {
            const numPart = char.image_url.substring(2);
            const bucket = (parseInt(numPart, 10) % 100)
              .toString()
              .padStart(2, "0");
            return `https://s2.vndb.org/ch/${bucket}/${numPart}.jpg`;
          })()
        : null,
    }));

    // 6. スタッフ情報を取得
    const staffResult = await client.query<Staff>(
      `
      SELECT 
        vs.aid as id,
        s.name, 
        vs.role, 
        vs.note
      FROM vndb.vn_staff vs
      JOIN vndb.staff_alias s ON vs.aid = s.aid
      WHERE vs.id = $1
      ORDER BY 
        CASE vs.role
          WHEN 'scenario' THEN 1
          WHEN 'chardesign' THEN 2
          WHEN 'art' THEN 3
          WHEN 'director' THEN 4
          WHEN 'music' THEN 5
          WHEN 'songs' THEN 6
          ELSE 7
        END,
        s.name
      LIMIT 30
      `,
      [id]
    );
    const staff = staffResult.rows;

    client.release();

    // ========================================
    // 画面を描画
    // ========================================
    return (
      <div className="min-h-screen p-8 bg-gray-50 text-gray-800">
        <main className="max-w-5xl mx-auto">
          {/* ナビゲーション */}
          <Link
            href="/"
            className="text-blue-600 hover:underline mb-6 inline-block font-medium"
          >
            ← トップページに戻る
          </Link>

          {/* メインカード */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* 左: パッケージ画像 */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={game.title}
                    className="w-64 h-auto rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-64 h-80 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* 右: 基本情報 */}
              <div className="flex-grow">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {game.title_ja || game.title}
                </h1>

                {game.title_ja && (
                  <p className="text-lg text-gray-500 mb-4">{game.title}</p>
                )}

                {/* 評価スコア */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg inline-flex">
                  <div>
                    <span className="text-sm text-gray-500 block">スコア</span>
                    <span className="text-4xl font-bold text-blue-600">
                      {game.rating ? Number(game.rating).toFixed(1) : "-"}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">/ 100</span>
                  </div>
                  {game.votecount && (
                    <div className="border-l border-gray-300 pl-4 ml-2">
                      <span className="text-sm text-gray-500 block">
                        投票数
                      </span>
                      <span className="text-lg font-medium text-gray-700">
                        {game.votecount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* タグ一覧 */}
                {tags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* コンテンツグリッド: あらすじ + スタッフ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 左カラム: あらすじ (2/3) */}
            <div className="lg:col-span-2">
              {game.description && (
                <div className="bg-white rounded-xl shadow-lg p-8 h-full">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    📖 あらすじ
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
                    {game.description
                      .replace(/\[url=.*?\](.*?)\[\/url\]/g, "$1")
                      .replace(/\[.*?\]/g, "")}
                  </div>
                </div>
              )}
            </div>

            {/* 右カラム: スタッフリスト (1/3) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  🛠️ スタッフ
                </h2>
                <div className="space-y-3">
                  {staff.length > 0 ? (
                    staff.map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0"
                      >
                        <span className="font-medium text-gray-900">
                          {s.name}
                        </span>
                        <span className="text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">
                          {s.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">情報なし</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* キャラクターセクション */}
          {characters.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                👤 キャラクター
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {characters.map((char) => (
                  <div
                    key={char.id}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-lg shadow-sm bg-gray-100">
                      {char.image_url ? (
                        <img
                          src={char.image_url}
                          alt={char.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          No Image
                        </div>
                      )}
                      {/* 役割バッジ */}
                      <span
                        className={`absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-sm ${
                          char.role === "main"
                            ? "bg-red-500"
                            : char.role === "primary"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                      >
                        {char.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gray-800 leading-tight">
                      {char.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* スクリーンショットセクション */}
          {screenshots.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                🖼️ スクリーンショット
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {screenshots.map((ss, index) => (
                  <a
                    key={index}
                    href={ss.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-80 transition-opacity overflow-hidden rounded-lg shadow-sm"
                  >
                    <img
                      src={ss.url}
                      alt={`スクリーンショット ${index + 1}`}
                      className="w-full h-auto object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    client.release();
    throw error;
  }
}
