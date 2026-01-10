# -----------------------------------------------------------------------------
# データの取得と保存を行うプログラムです。（ステップ2：データ取得と保存の実装）
# 初学者の方にも分かりやすいよう、各行に詳細なコメントをつけています。
# -----------------------------------------------------------------------------

import requests
import json
import psycopg2
from psycopg2.extras import Json
from datetime import datetime

# -----------------------------------------------------------------------------
# 1. 設定・接続・テーブル作成（ステップ1と同じ）
# -----------------------------------------------------------------------------
DB_CONFIG = {
    'dbname': 'postgres',
    'user': 'myuser',
    'password': 'mypassword',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """データベースへの接続を確立します"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"データベース接続エラー: {e}")
        raise

def create_table_if_not_exists(conn):
    """テーブルが存在しない場合、作成します"""
    schema = """
    CREATE TABLE IF NOT EXISTS visual_novels (
        id VARCHAR(50) PRIMARY KEY,
        title TEXT NOT NULL,
        alttitle TEXT,
        released DATE,
        description TEXT,
        image_url TEXT,
        image_sexual REAL,
        image_violence REAL,
        rating REAL,
        votecount INTEGER,
        tags JSONB,
        developers JSONB,
        screenshots JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    with conn.cursor() as cur:
        cur.execute(schema)
    conn.commit()
    # 既に作成済みの場合が多いため、メッセージは控えめにします

# -----------------------------------------------------------------------------
# 2. データ取得関数（VNDB APIから）
# -----------------------------------------------------------------------------
def fetch_vndb_data():
    """
    VNDB (Visual Novel Database) のAPIから、ゲームの情報を取得します。
    """
    url = 'https://api.vndb.org/kana/vn'
    
    # 欲しいデータの項目（フィールド）を指定します
    # ネストされたデータ（tags.nameなど）もここで指定できます
    fields = [
        "id", "title", "alttitle", "released", "description",
        "image.url", "image.sexual", "image.violence",
        "rating", "votecount",
        "tags.name", "tags.rating",  # タグ情報
        "developers.name",           # 開発会社
        "screenshots.url"            # スクショ
    ]
    
    # APIに送るリクエストの内容（ペイロード）を作ります
    payload = {
        "filters": [],           # 検索フィルタは空（全件対象）
        "fields": ", ".join(fields), # 上のリストをカンマ区切りの文字列にします
        "sort": "votecount",     # 人気投票数順にソートします
        "reverse": True,         # 降順（多い順）にします
        "results": 10            # まずは10件だけ取得してみます
    }
    
    headers = {'Content-Type': 'application/json'}
    
    print("VNDB APIからデータを取得中...")
    response = requests.post(url, headers=headers, json=payload)
    
    # エラーチェック: サーバーからの返事が200 OK以外ならエラーにします
    response.raise_for_status()
    
    data = response.json()
    # 結果リストを返します。リストがなければ空リストを返します
    return data.get('results', [])

# -----------------------------------------------------------------------------
# 3. データ保存関数（UPSERT処理）
# -----------------------------------------------------------------------------
def upsert_visual_novel(conn, vn_data):
    """
    1つのゲームデータをデータベースに保存します。
    既に同じIDのデータがある場合は「更新」、なければ「新規登録」します。
    これを UPSERT (Update + Insert) と呼びます。
    """
    
    # --- A. データの取り出し ---
    # 辞書から必要なデータを取り出して変数に入れます
    # .get() を使うと、キーが存在しない場合にエラーにならず None を返してくれます
    vn_id = vn_data.get('id')
    title = vn_data.get('title')
    alttitle = vn_data.get('alttitle')
    released = vn_data.get('released')
    description = vn_data.get('description')
    
    # 画像情報は入れ子（辞書の中に辞書）になっているので注意して取り出します
    image = vn_data.get('image') or {} # もしNoneなら空の辞書{}にします
    image_url = image.get('url')
    image_sexual = image.get('sexual')
    image_violence = image.get('violence')
    
    rating = vn_data.get('rating')
    votecount = vn_data.get('votecount')
    
    # リスト形式のデータ（タグなど）は、DB保存用にJSON形式に変換します
    # psycopg2.extras.Json() が便利です
    tags = Json(vn_data.get('tags', []))
    developers = Json(vn_data.get('developers', []))
    screenshots = Json(vn_data.get('screenshots', []))
    
    # --- B. SQL文の作成 ---
    # プレースホルダ (%s) を使って、データとSQLを分離します（セキュリティ対策）
    sql = """
    INSERT INTO visual_novels (
        id, title, alttitle, released, description,
        image_url, image_sexual, image_violence,
        rating, votecount,
        tags, developers, screenshots,
        updated_at
    ) VALUES (
        %s, %s, %s, %s, %s,
        %s, %s, %s,
        %s, %s,
        %s, %s, %s,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) -- もし「ID」が衝突したら（既にあったら）
    DO UPDATE SET    -- 以下の内容でデータを更新(UPDATE)してください
        title = EXCLUDED.title,
        alttitle = EXCLUDED.alttitle,
        released = EXCLUDED.released,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        image_sexual = EXCLUDED.image_sexual,
        image_violence = EXCLUDED.image_violence,
        rating = EXCLUDED.rating,
        votecount = EXCLUDED.votecount,
        tags = EXCLUDED.tags,
        developers = EXCLUDED.developers,
        screenshots = EXCLUDED.screenshots,
        updated_at = CURRENT_TIMESTAMP;
    """
    
    # --- C. SQLの実行 ---
    with conn.cursor() as cur:
        cur.execute(sql, (
            vn_id, title, alttitle, released, description,
            image_url, image_sexual, image_violence,
            rating, votecount,
            tags, developers, screenshots
        ))

# -----------------------------------------------------------------------------
# 4. メイン処理（実行フロー）
# -----------------------------------------------------------------------------
def main():
    conn = None
    try:
        print("--- ステップ2: データの取得と保存 ---")
        
        # 1. 接続
        conn = get_db_connection()
        create_table_if_not_exists(conn) # 念のため確認
        
        # 2. VNDBからデータ取得
        results = fetch_vndb_data()
        print(f"{len(results)} 件のデータを取得しました。")
        
        # 3. データを1件ずつDBに保存
        count = 0
        for vn in results:
            upsert_visual_novel(conn, vn)
            count += 1
            print(f"[{count}/{len(results)}] 保存完了: {vn.get('title')}")
            
        # 4. 変更を確定（コミット）
        conn.commit()
        print("全ての処理が完了しました！")
        
    except Exception as e:
        if conn:
            conn.rollback() # エラー時は取り消し
        print(f"処理中にエラーが発生しました: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    main()
