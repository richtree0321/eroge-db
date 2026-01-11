// ========================================
// 必要なライブラリ（道具）をインポート（読み込み）
// ========================================

// pgライブラリから「Pool」という道具を読み込む
// Poolは「データベース接続のプール（複数の接続を使い回す仕組み）」のこと
// Pythonでいう psycopg2.connect() に似ているが、より効率的
import { Pool } from 'pg';
import { translateTag } from '@/lib/tagTranslations';  // タグ翻訳関数をインポート

// ========================================
// データベース接続プール（コネクションプール）の作成
// ========================================

// Poolを作成する（= データベースへの接続窓口を用意する）
// process.env.DATABASE_URL は、先ほど作った .env.local ファイルから自動で読み込まれる
// つまり「postgresql://myuser:mypassword@localhost:5432/erogedb」という接続文字列が入っている
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ========================================
// TypeScriptの型定義（データの「型」を決める）
// ========================================

// VisualNovel という「型」を定義する
// これは「ゲーム1つ分のデータがどんな形をしているか」を説明するもの
// Pythonでいう辞書 (dict) の「鍵 (key) のリスト」を事前に決めておくイメージ
type VisualNovel = {
  id: string;               // IDは文字列（例: "v11"）
  title: string;            // タイトルは文字列（ローマ字表記、例: "Fate/stay night"）
  alttitle: string | null;  // 日本語タイトル（例: "沙耶の唄」）nullの場合もある
  rating: number;           // 評価点は数値（例: 8.5）
  image_url: string;        // 画像URL（パッケージ画像のWebアドレス）
  votecount: number | null; // 投票数（例: 3923）
  released: string | null;  // 発売日（例: "2007-04-12"）
  tags: Array<{name: string; rating: number}> | null;  // タグ情報（JSONB配列）
};

// ========================================
// メインのコンポーネント（画面を作る関数）
// ========================================

// 「export default」は「このファイルの主役」という意味
// 「async」は「非同期処理（時間がかかる処理）を待てる関数」という意味
// Pythonでいう「async def」に相当する
export default async function Home() {
  
  // ========================================
  // 1. データベースからデータを取得する
  // ========================================
  
  // プールから接続を1つ借りる（= 電話回線を1本確保するイメージ）
  // 「await」は「この処理が終わるまで待つ」という意味
  const client = await pool.connect();
  
  // SQLクエリ: 必要なデータを取得
  // タグ、投票数、発売日も含めて取得します
  const result = await client.query<VisualNovel>(
    'SELECT id, title, alttitle, rating, image_url, votecount, released, tags FROM visual_novels ORDER BY rating DESC LIMIT 100'
  );
  
  // SQLの実行結果から「行データ（rows）」を取り出す
  // result.rows は配列（リスト）になっている
  // Pythonでいう cursor.fetchall() の返り値に相当
  const games = result.rows;
  
  // 使い終わった接続を返却する（借りた電話回線を返すイメージ）
  // これをしないと接続が溜まってメモリリークの原因になる
  client.release();

  // ========================================
  // 2. 画面（HTML）を作る
  // ========================================
  
  // 「return」は「この画面の内容（HTML）を返す」という意味
  // 以下のHTMLのような見た目のコードは「JSX」という書き方（JavaScriptの中でHTMLを書ける）
  return (
    // 一番外側の枠
    // className は HTMLの class属性 に相当（CSSでスタイルを当てるための目印）
    // Tailwind CSS という書き方で、クラス名だけでデザインを指定している
    <div className="min-h-screen p-8 bg-gray-50">
      {/* メインコンテンツの枠 */}
      <main className="max-w-7xl mx-auto">
        
        {/* ページのタイトル */}
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          🎮 エロゲDB (開発中)
        </h1>

        {/* ゲームのリスト（カード形式で並べる） */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* ここからJavaScriptのコード（波かっこ {} で囲む） */}
          {/* games.map() は配列の各要素に対して処理を繰り返す（Pythonの for文に相当） */}
          {games.map((game) => (
            
            // 1つのゲームを表示するカード
            // key={game.id} は React/Next.js のルール（各要素にユニークなIDをつける必要がある）
            <div 
              key={game.id} 
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              {/* ✨ フレックスボックスで画像とテキストを横並びにする */}
              {/* flex = 横並び配置, gap-6 = 要素間に隙間を作る */}
              <div className="flex gap-6">
                
                {/* ✨ 画像エリア */}
                {/* w-24 = 幅24単位（約6rem = 96px）, h-32 = 高さ32単位（約8rem = 128px） */}
                {/* flex-shrink-0 = 画面が狭くなっても画像サイズを維持する */}
                <div className="w-24 h-32 flex-shrink-0">
                  {/* 画像を表示する標準のHTMLタグ */}
                  {/* src={game.image_url} = 画像のURL（データベースから取得したもの）を指定 */}
                  {/* alt={game.title} = 画像が読み込めない時に表示するテキスト（アクセシビリティ対応） */}
                  <img 
                    src={game.image_url} 
                    alt={game.title}
                    className="w-full h-full object-cover rounded shadow-sm"
                    // object-cover = 画像を枠にフィットさせる（縦横比を保ちつつ、はみ出た部分は切り取る）
                    // rounded = 角を丸くする
                    // shadow-sm = 小さな影をつける
                  />
                </div>

                {/* テキストエリア */}
                {/* flex-grow = 残りのスペースを全て使う（画像の横幅を除いた部分を占有） */}
                {/* flex-col = 縦方向に並べる */}
                {/* justify-between = 上下に要素を配置（タイトルは上、スコアは下） */}
                <div className="flex-grow flex flex-col justify-between">
                  
                  {/* タイトル表示 */}
                  {/* 日本語タイトル（alttitle）があればそれを表示、なければローマ字タイトル（title）を表示 */}
                  {/* || は「または」という意味（alttitleがnullならtitleを使う） */}
                  <h2 className="text-xl font-semibold text-gray-900">
                    {game.alttitle || game.title}
                  </h2>
                  
                  {/* 発売日表示 */}
                  {game.released && (
                    <p className="text-sm text-gray-500 mt-1">
                      {/* 発売日をYYYY-MM-DD形式から「YYYY年MM月」形式に変換 */}
                      {new Date(game.released).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                    </p>
                  )}

                  {/* タグ表示 */}
                  {game.tags && game.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {/* タグは最大3つまで表示 */}
                      {game.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                        >
                          {/* translateTag関数で英語タグを日本語に翻訳 */}
                          {translateTag(tag.name)}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* スコアと投票数 */}
                  <div className="mt-auto">
                    {/* スコア表示 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">スコア:</span>
                      {/* text-2xl = 文字サイズを大きく（評価点を目立たせる） */}
                      <span className="text-2xl font-bold text-blue-600">
                        {game.rating}
                      </span>
                    </div>
                    
                    {/* 投票数表示 */}
                    {game.votecount && (
                      <p className="text-xs text-gray-400 mt-1">
                        {/* 投票数を3桁区切りで表示（例: 3,923） */}
                        {game.votecount.toLocaleString()}票
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
