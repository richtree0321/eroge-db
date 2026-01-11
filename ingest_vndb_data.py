#!/home/rich/eroge-db/.venv/bin/python
# -----------------------------------------------------------------------------
# データの取得と保存を行うプログラムです。（ステップ2：データ取得と保存の実装）
# 初学者の方にも分かりやすいよう、各行に詳細なコメントをつけています。
# -----------------------------------------------------------------------------

import requests
import json
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# -----------------------------------------------------------------------------
# タグ翻訳辞書（英語→日本語）
# VNDBから取得したタグを日本語に翻訳するための辞書
# -----------------------------------------------------------------------------
TAG_TRANSLATIONS = {
    # ジャンル・カテゴリ
    'ADV': 'アドベンチャー',
    'AVG': 'アドベンチャー',
    'Horror': 'ホラー',
    'Romance': 'ロマンス',
    'Comedy': 'コメディ',
    'Drama': 'ドラマ',
    'Fantasy': 'ファンタジー',
    'Sci-fi': 'SF',
    'Mystery': 'ミステリー',
    'Thriller': 'スリラー',
    'Action': 'アクション',
    
    # 主人公
    'Male Protagonist': '男性主人公',
    'Female Protagonist': '女性主人公',
    
    # 設定
    'School Life': '学校生活',
    'High School': '高校',
    'School': '学校',
    'College': '大学',
    'Modern Day': '現代',
    'Future': '未来',
    'Past': '過去',
    'Japan': '日本',
    'Slice of Life': '日常系',
    
    # メカニクス
    'Multiple Endings': 'マルチエンディング',
    'Choices': '選択肢',
    'Branching Plot': '分岐シナリオ',
    'Linear Plot': '一本道',
    'Point and Click': 'ポイント&クリック',
    
    # コンテンツ警告
    'Sexual Content': '性的コンテンツ',
    'Eroge': 'エロゲ',
    'No Sexual Content': '性的コンテンツなし',
    'Violence': '暴力表現',
    'Gore': 'グロ表現',
    
    # その他人気タグ
    'Nakige': '泣きゲー',
    'Utsuge': '鬱ゲー',
    'Kinetic Novel': 'キネティックノベル',
    'Visual Novel': 'ビジュアルノベル',
    'RPG': 'RPG',
    'Simulation': 'シミュレーション',
    'Strategy': 'ストラテジー',
    'Puzzle': 'パズル',
    
    # テーマ
    'Time Travel': 'タイムトラベル',
    'Supernatural': '超常現象',
    'Magic': '魔法',
    'War': '戦争',
    'Post-apocalyptic': 'ポストアポカリプス',
    'Cyberpunk': 'サイバーパンク',
    'Steampunk': 'スチームパンク',
    
    # キャラクター属性
    'Tsundere': 'ツンデレ',
    'Yandere': 'ヤンデレ',
    'Kuudere': 'クーデレ',
    'Childhood Friend': '幼馴染',
    'Maid': 'メイド',
    'Teacher': '教師',
    'Student': '学生',
}

# -----------------------------------------------------------------------------
# 1. 設定・接続・テーブル作成（ステップ1と同じ）
# -----------------------------------------------------------------------------
DB_CONFIG = {
    'dbname': os.getenv('POSTGRES_DB'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'host': os.getenv('POSTGRES_HOST'),
    'port': os.getenv('POSTGRES_PORT')
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
        "titles.lang", "titles.title",  # 各言語のタイトル情報
        "tags.name", "tags.rating",      # タグ情報
        "developers.name",               # 開発会社
        "screenshots.url"                # スクショ
    ]
    
    # APIに送るリクエストの内容（ペイロード）を作ります
    payload = {
        "filters": [],           # 検索フィルタは空（全件対象）
        "fields": ", ".join(fields), # 上のリストをカンマ区切りの文字列にします
        "sort": "votecount",     # 人気投票数順にソートします
        "reverse": True,         # 降順（多い順）にします
        "results": 100           # 人気投票数トップ100件を取得します
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
# 3. 日本語タイトル抽出関数
# -----------------------------------------------------------------------------
def get_japanese_title(vn_data):
    """
    titles配列から lang: "ja" のタイトルを探して返す。
    見つからなければ alttitle を返す。
    これにより、「かたわ少女」や「ドキドキ文芸部!」のような
    日本語タイトルを優先的に取得できる。
    """
    # まず既存の alttitle をチェック
    alttitle = vn_data.get('alttitle')
    if alttitle:  # alttitle が存在すればそれを返す
        return alttitle
    
    # alttitle がない場合、titles配列から lang: "ja" を探す
    titles_list = vn_data.get('titles', [])
    for t in titles_list:
        if t.get('lang') == 'ja':  # 日本語のタイトルを発見
            return t.get('title')
    
    # どちらもなければ None を返す
    return None

# -----------------------------------------------------------------------------
# 4. データ保存関数（UPSERT処理）
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
    # 日本語タイトルを取得（alttitle または titles配列から）
    alttitle = get_japanese_title(vn_data)
    released = vn_data.get('released')
    description = vn_data.get('description')
    
    # 画像情報は入れ子（辞書の中に辞書）になっているので注意して取り出します
    image = vn_data.get('image') or {} # もしNoneなら空の辞書{}にします
    image_url = image.get('url')
    image_sexual = image.get('sexual')
    image_violence = image.get('violence')
    
    rating = vn_data.get('rating')
    votecount = vn_data.get('votecount')
    
    # --- タグ処理：日本語翻訳を追加 ---
    # VNDBから取得したタグ（英語）に、日本語名（name_ja）を追加します
    tags_raw = vn_data.get('tags', [])  # タグのリストを取得（なければ空リスト）
    tags_with_translation = []  # 翻訳済みタグを格納するリスト
    
    for tag in tags_raw:
        # 既存のタグデータをそのまま保持
        tag_name = tag.get('name', '')  # タグの英語名
        
        # 翻訳辞書から日本語名を取得（なければ英語名をそのまま使用）
        tag['name_ja'] = TAG_TRANSLATIONS.get(tag_name, tag_name)
        
        # 翻訳済みタグをリストに追加
        tags_with_translation.append(tag)
    
    # リスト形式のデータ（タグなど）は、DB保存用にJSON形式に変換します
    # psycopg2.extras.Json() が便利です
    tags = Json(tags_with_translation)  # 翻訳済みタグをJSON化
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
