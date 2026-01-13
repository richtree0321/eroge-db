-- ========================================
-- search_vns テーブル作成・更新スクリプト
-- ========================================
-- 
-- このスクリプトは、vndb スキーマの正規化データから
-- 検索用の非正規化テーブル public.search_vns を作成/更新します。
-- 
-- 実行方法:
--   docker exec -it eroge-postgres psql -U myuser -d erogedb -f /path/to/create_search_vns.sql
-- または:
--   docker exec -i eroge-postgres psql -U myuser -d erogedb < sql/create_search_vns.sql
-- ========================================

-- ========================================
-- 1. テーブル作成（存在しない場合のみ）
-- ========================================
CREATE TABLE IF NOT EXISTS public.search_vns (
    id TEXT PRIMARY KEY,              -- VN ID (例: "v11")
    title TEXT,                       -- 原語タイトル
    title_ja TEXT,                    -- 日本語タイトル
    released DATE,                    -- 発売日
    rating NUMERIC,                   -- 評価点 (0-100)
    votecount INTEGER,                -- 投票数
    tag_ids INTEGER[],                -- タグIDの配列 (GINインデックス用)
    cover_url TEXT,                   -- パッケージ画像URL
    display JSONB                     -- 一覧表示用の追加データ (将来用)
);

-- ========================================
-- 2. データ投入/更新
-- ========================================
-- 既存データを削除して再投入（完全リフレッシュ）
TRUNCATE TABLE public.search_vns;

-- vndb スキーマから検索用データを抽出
INSERT INTO public.search_vns (id, title, title_ja, released, rating, votecount, tag_ids, cover_url)
SELECT 
    v.id,
    -- 原語タイトル（olang = original language）
    (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = v.olang LIMIT 1) as title,
    -- 日本語タイトル
    (SELECT t.title FROM vndb.vn_titles t WHERE t.id = v.id AND t.lang = 'ja' LIMIT 1) as title_ja,
    -- 発売日（レコードから直接）
    CASE 
        WHEN v.c_released > 0 THEN 
            -- YYYYMMDD形式を日付に変換（日が00の場合は01に）
            TO_DATE(
                LPAD(v.c_released::text, 8, '0'),
                'YYYYMMDD'
            )
        ELSE NULL 
    END as released,
    -- 評価点（10で割って100点満点に）
    v.c_rating::numeric / 10 as rating,
    -- 投票数
    v.c_votecount as votecount,
    -- タグIDの配列（vote > 0、ignore = false のみ）
    (
        SELECT ARRAY_AGG(DISTINCT tv.tag)
        FROM vndb.tags_vn tv
        WHERE tv.vid = v.id AND tv.vote > 0 AND NOT tv.ignore
    ) as tag_ids,
    -- カバー画像URL（バケット計算込み）
    CASE 
        WHEN v.c_image IS NOT NULL THEN
            'https://s2.vndb.org/cv/' || 
            LPAD((SUBSTRING(v.c_image FROM 3)::integer % 100)::text, 2, '0') ||
            '/' || SUBSTRING(v.c_image FROM 3) || '.jpg'
        ELSE NULL
    END as cover_url
FROM vndb.vn v;

-- ========================================
-- 3. インデックス作成（高速検索用）
-- ========================================

-- 評価順ソート用のBTREEインデックス
CREATE INDEX IF NOT EXISTS idx_search_vns_rating 
ON public.search_vns (rating DESC NULLS LAST);

-- 投票数順ソート用のBTREEインデックス
CREATE INDEX IF NOT EXISTS idx_search_vns_votecount 
ON public.search_vns (votecount DESC NULLS LAST);

-- 発売日順ソート用のBTREEインデックス
CREATE INDEX IF NOT EXISTS idx_search_vns_released 
ON public.search_vns (released DESC NULLS LAST);

-- タグ検索用のGINインデックス（配列の要素検索を高速化）
CREATE INDEX IF NOT EXISTS idx_search_vns_tag_ids 
ON public.search_vns USING GIN (tag_ids);

-- ========================================
-- 4. 結果確認
-- ========================================
SELECT 
    COUNT(*) as total_count,
    COUNT(rating) as rated_count,
    COUNT(title_ja) as japanese_title_count
FROM public.search_vns;
