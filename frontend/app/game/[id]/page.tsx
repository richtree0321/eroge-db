// ========================================
// ゲーム詳細ページ - vndb スキーマから直接取得
// ========================================

import { pool } from "@/lib/db"; // 共通化されたDBプールをインポート
import Link from "next/link"; // Next.js のリンクコンポーネント
import { Character, Staff } from "@/lib/types"; // 型定義をインポート
import { buildExternalUrl, ExternalLinkItem } from "@/lib/extlinks"; // 外部リンク変換関数と型をインポート
import ExternalLinksSection from "./ExternalLinksSection"; // 外部リンク表示コンポーネントをインポート

// ページの引数型（Next.js 15 では params は Promise）
type PageProps = {
  params: Promise<{ id: string }>; // URL パラメータ（例: /game/v11 の "v11"）
};

type ExternalLinkRow = { // 外部リンクの基本行（VN用）を表す型
  site: string; // サイト識別子
  value: string; // 外部リンクの値
}; // 型定義の終わり

type ReleaseExternalLinkRow = { // リリース外部リンクの行を表す型
  release_id: string; // リリースID
  release_title: string | null; // リリースタイトル（日本語があれば使用）
  site: string; // サイト識別子
  value: string; // 外部リンクの値
}; // 型定義の終わり

type ProducerExternalLinkRow = { // 制作会社外部リンクの行を表す型
  producer_id: string; // 制作会社ID
  producer_name: string; // 制作会社名
  site: string; // サイト識別子
  value: string; // 外部リンクの値
}; // 型定義の終わり

type StaffExternalLinkRow = { // スタッフ外部リンクの行を表す型
  staff_id: string; // スタッフID
  staff_name: string; // スタッフ名
  site: string; // サイト識別子
  value: string; // 外部リンクの値
}; // 型定義の終わり

type ReleaseLinkGroup = { // リリースごとの外部リンクのまとまりを表す型
  releaseId: string; // リリースID
  releaseTitle: string | null; // リリースタイトル
  links: ExternalLinkItem[]; // 外部リンク配列
}; // 型定義の終わり

type ProducerLinkGroup = { // 制作会社ごとの外部リンクのまとまりを表す型
  producerId: string; // 制作会社ID
  producerName: string; // 制作会社名
  links: ExternalLinkItem[]; // 外部リンク配列
}; // 型定義の終わり

type StaffLinkGroup = { // スタッフごとの外部リンクのまとまりを表す型
  staffId: string; // スタッフID
  staffName: string; // スタッフ名
  links: ExternalLinkItem[]; // 外部リンク配列
}; // 型定義の終わり

export default async function GameDetailPage({ params }: PageProps) {
  // params を await して id を取得
  const { id } = await params;
  // データベースからコネクションを取得
  const client = await pool.connect();

  try {
    // ========================================
    // 1. 基本情報を取得（必須、存在チェックに使用）
    // ========================================
    const vnResult = await client.query(
      `
      SELECT 
        v.id,
        v.c_rating::numeric / 10 as rating,  -- 評価スコア（10で割って100点満点に）
        v.c_votecount as votecount,          -- 投票数
        v.description,                        -- 作品説明
        v.c_image,                            -- カバー画像ID
        (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = v.olang LIMIT 1) as title,      -- 原語タイトル
        (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = 'ja' LIMIT 1) as title_ja       -- 日本語タイトル
      FROM vndb.vn v
      WHERE v.id = $1
    `,
      [id]
    );

    // ゲームが見つからない場合は404的な表示
    if (vnResult.rows.length === 0) {
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

    const game = vnResult.rows[0]; // 取得したゲームデータ

    // ========================================
    // 2. 画像URLを構築（VNDBのバケット計算ロジック）
    // ========================================
    // 画像IDは "cv12345" のような形式で、12345 % 100 がバケット番号
    const coverUrl = game.c_image
      ? (() => {
          const numPart = game.c_image.substring(2); // "cv" を除去
          const bucket = (parseInt(numPart, 10) % 100)
            .toString()
            .padStart(2, "0"); // 2桁のバケット番号
          return `https://s2.vndb.org/cv/${bucket}/${numPart}.jpg`;
        })()
      : null;

    // ========================================
    // 3. 関連データを並列取得（Promise.all で高速化）
    // ========================================
    // 依存関係がないクエリは同時に実行してTTFBを短縮
    const [ // 並列取得の結果を配列で受け取る
      tagsResult, // タグ取得の結果
      screenshotsResult, // スクリーンショット取得の結果
      charsResult, // キャラクター取得の結果
      staffResult, // スタッフ取得の結果
      vnLinksResult, // VN外部リンク取得の結果
      releaseLinksResult, // リリース外部リンク取得の結果
      producerLinksResult, // 制作会社外部リンク取得の結果
      staffLinksResult, // スタッフ外部リンク取得の結果
    ] = await Promise.all([ // Promise.allでクエリを並列実行
        // タグ情報を取得
        client.query(
          `
          SELECT DISTINCT t.name, t.id
          FROM vndb.tags t
          JOIN vndb.tags_vn tv ON t.id = tv.tag
          WHERE tv.vid = $1 AND tv.vote > 0 AND NOT tv.ignore
          LIMIT 20
        `,
          [id]
        ),

        // スクリーンショットを取得
        client.query(
          `
          SELECT i.id
          FROM vndb.images i
          JOIN vndb.vn_screenshots vs ON i.id = vs.scr
          WHERE vs.id = $1
          LIMIT 12
        `,
          [id]
        ),

        // キャラクター情報を取得
        client.query<Character>(
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
        ),

        // スタッフ情報を取得
        client.query<Staff>(
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
        ),

        // VN外部リンクを取得
        client.query<ExternalLinkRow>( // VNに直接紐付く外部リンクを取得
          `
          SELECT 
            e.site,
            e.value
          FROM vndb.vn_extlinks ve
          JOIN vndb.extlinks e ON e.id = ve.link
          WHERE ve.id = $1
          ORDER BY e.site, e.value
          `,
          [id]
        ), // VN外部リンクのクエリ終わり

        // リリース外部リンクを取得
        client.query<ReleaseExternalLinkRow>( // リリースに紐付く外部リンクを取得
          `
          SELECT 
            rv.id as release_id,
            rt.title as release_title,
            e.site,
            e.value
          FROM vndb.releases_vn rv
          JOIN vndb.releases_extlinks rel ON rel.id = rv.id
          JOIN vndb.extlinks e ON e.id = rel.link
          LEFT JOIN vndb.releases_titles rt ON rt.id = rv.id AND rt.lang = 'ja'
          WHERE rv.vid = $1
          ORDER BY rv.id, e.site, e.value
          `,
          [id]
        ), // リリース外部リンクのクエリ終わり

        // 制作会社外部リンクを取得
        client.query<ProducerExternalLinkRow>( // 制作会社に紐付く外部リンクを取得
          `
          SELECT DISTINCT
            p.id as producer_id,
            p.name as producer_name,
            e.site,
            e.value
          FROM vndb.releases_vn rv
          JOIN vndb.releases_producers rp ON rp.id = rv.id
          JOIN vndb.producers p ON p.id = rp.pid
          JOIN vndb.producers_extlinks pe ON pe.id = p.id
          JOIN vndb.extlinks e ON e.id = pe.link
          WHERE rv.vid = $1
          ORDER BY p.name, e.site, e.value
          `,
          [id]
        ), // 制作会社外部リンクのクエリ終わり

        // スタッフ外部リンクを取得
        client.query<StaffExternalLinkRow>( // スタッフに紐付く外部リンクを取得
          `
          SELECT DISTINCT
            sa.id as staff_id,
            sa.name as staff_name,
            e.site,
            e.value
          FROM vndb.vn_staff vs
          JOIN vndb.staff_alias sa ON sa.aid = vs.aid
          JOIN vndb.staff_extlinks se ON se.id = sa.id
          JOIN vndb.extlinks e ON e.id = se.link
          WHERE vs.id = $1
          ORDER BY sa.name, e.site, e.value
          `,
          [id]
        ), // スタッフ外部リンクのクエリ終わり
      ]);

    // 取得結果を変数に格納
    const tags = tagsResult.rows; // タグ結果を変数に入れる
    const staff = staffResult.rows; // スタッフ結果を変数に入れる

    const vnLinks = vnLinksResult.rows.map((link) => ({ // VN外部リンクをURL化して配列にする
      site: link.site, // サイト識別子をコピー
      value: link.value, // 元の値をコピー
      url: buildExternalUrl(link.site, link.value), // ルールに従ってURL化
    })); // VN外部リンク配列の作成終わり

    const releaseLinksById: Record<string, ReleaseLinkGroup> = {}; // リリースIDごとに外部リンクをまとめる入れ物
    releaseLinksResult.rows.forEach((row) => { // 取得したリリース外部リンクを順に処理
      if (!releaseLinksById[row.release_id]) { // まだそのリリースIDが登録されていない場合
        releaseLinksById[row.release_id] = { // 新しいリリースグループを作成
          releaseId: row.release_id, // リリースIDを保存
          releaseTitle: row.release_title, // リリースタイトルを保存
          links: [], // 外部リンクの配列を初期化
        }; // グループ作成の終わり
      } // ifブロックの終わり
      releaseLinksById[row.release_id].links.push({ // 該当リリースのリンク配列に追加
        site: row.site, // サイト識別子を保存
        value: row.value, // 元の値を保存
        url: buildExternalUrl(row.site, row.value), // URL化した結果を保存
      }); // 追加処理の終わり
    }); // forEachの終わり
    const releaseLinkGroups = Object.values(releaseLinksById); // まとまりを配列に変換

    const producerLinksById: Record<string, ProducerLinkGroup> = {}; // 制作会社IDごとの外部リンクをまとめる入れ物
    producerLinksResult.rows.forEach((row) => { // 取得した制作会社外部リンクを順に処理
      if (!producerLinksById[row.producer_id]) { // まだその制作会社IDが登録されていない場合
        producerLinksById[row.producer_id] = { // 新しい制作会社グループを作成
          producerId: row.producer_id, // 制作会社IDを保存
          producerName: row.producer_name, // 制作会社名を保存
          links: [], // 外部リンクの配列を初期化
        }; // グループ作成の終わり
      } // ifブロックの終わり
      producerLinksById[row.producer_id].links.push({ // 該当制作会社のリンク配列に追加
        site: row.site, // サイト識別子を保存
        value: row.value, // 元の値を保存
        url: buildExternalUrl(row.site, row.value), // URL化した結果を保存
      }); // 追加処理の終わり
    }); // forEachの終わり
    const producerLinkGroups = Object.values(producerLinksById); // まとまりを配列に変換

    const staffLinksById: Record<string, StaffLinkGroup> = {}; // スタッフIDごとの外部リンクをまとめる入れ物
    staffLinksResult.rows.forEach((row) => { // 取得したスタッフ外部リンクを順に処理
      if (!staffLinksById[row.staff_id]) { // まだそのスタッフIDが登録されていない場合
        staffLinksById[row.staff_id] = { // 新しいスタッフグループを作成
          staffId: row.staff_id, // スタッフIDを保存
          staffName: row.staff_name, // スタッフ名を保存
          links: [], // 外部リンクの配列を初期化
        }; // グループ作成の終わり
      } // ifブロックの終わり
      staffLinksById[row.staff_id].links.push({ // 該当スタッフのリンク配列に追加
        site: row.site, // サイト識別子を保存
        value: row.value, // 元の値を保存
        url: buildExternalUrl(row.site, row.value), // URL化した結果を保存
      }); // 追加処理の終わり
    }); // forEachの終わり
    const staffLinkGroups = Object.values(staffLinksById); // まとまりを配列に変換

    // スクリーンショットのURLを構築（バケット計算）
    const screenshots = screenshotsResult.rows.map((ss) => {
      const numPart = ss.id.substring(2); // "sf" を除去
      const bucket = (parseInt(numPart, 10) % 100).toString().padStart(2, "0");
      return { url: `https://s2.vndb.org/sf/${bucket}/${numPart}.jpg` };
    });

    // キャラクター画像のURLを構築（バケット計算）
    const characters = charsResult.rows.map((char) => ({
      ...char,
      image_url: char.image_url
        ? (() => {
            const numPart = char.image_url.substring(2); // "ch" を除去
            const bucket = (parseInt(numPart, 10) % 100)
              .toString()
              .padStart(2, "0");
            return `https://s2.vndb.org/ch/${bucket}/${numPart}.jpg`;
          })()
        : null,
    }));

    // ========================================
    // 画面を描画（JSX を返す）
    // ========================================
    return (
      <div className="min-h-screen p-8 bg-gray-50 text-gray-800">
        <main className="max-w-5xl mx-auto">
          {/* ナビゲーション：トップページに戻るリンク */}
          <Link
            href="/"
            className="text-blue-600 hover:underline mb-6 inline-block font-medium"
          >
            ← トップページに戻る
          </Link>

          {/* メインカード：基本情報 */}
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
                {/* タイトル（日本語優先） */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {game.title_ja || game.title}
                </h1>

                {/* 原語タイトル（日本語がある場合のみ表示） */}
                {game.title_ja && (
                  <p className="text-lg text-gray-500 mb-4">{game.title}</p>
                )}

                {/* 評価スコアと投票数 */}
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
                  {/* BBCodeを除去して表示 */}
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
                    {game.description
                      .replace(/\[url=.*?\](.*?)\[\/url\]/g, "$1") // [url]タグを除去
                      .replace(/\[.*?\]/g, "")}{" "}
                    {/* その他のBBCodeを除去 */}
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

          <ExternalLinksSection vnLinks={vnLinks} releaseLinkGroups={releaseLinkGroups} producerLinkGroups={producerLinkGroups} staffLinkGroups={staffLinkGroups} /> {/* 外部リンクセクションを表示 */}

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
                    {/* キャラクター画像 */}
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
                      {/* 役割バッジ（main/primary/sideで色分け） */}
                      <span
                        className={`absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-sm ${
                          char.role === "main"
                            ? "bg-red-500" // メインキャラは赤
                            : char.role === "primary"
                            ? "bg-blue-500" // プライマリは青
                            : "bg-gray-400" // その他はグレー
                        }`}
                      >
                        {char.role.toUpperCase()}
                      </span>
                    </div>
                    {/* キャラクター名 */}
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
  } finally {
    // ----------------------------------------
    // 必ずコネクションを解放する（try/finally パターン）
    // これにより例外が発生しても接続リークを防止
    // ----------------------------------------
    client.release();
  }
}
