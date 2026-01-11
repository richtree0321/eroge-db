#!/home/rich/eroge-db/.venv/bin/python
# -----------------------------------------------------------------------------
# 既存のタグデータに日本語翻訳（name_ja）を追加するスクリプト
# データベース内の全ゲームのタグを読み取り、翻訳を追加して更新します
# -----------------------------------------------------------------------------

import psycopg2
from psycopg2.extras import Json
import os
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# タグ翻訳辞書（ingest_vndb_data.pyと同じもの）
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
    'Male Protagonist': '男性主人公',
    'Female Protagonist': '女性主人公',
    'School Life': '学校生活',
    'High School': '高校',
    'School': '学校',
    'College': '大学',
    'Modern Day': '現代',
    'Future': '未来',
    'Past': '過去',
    'Japan': '日本',
    'Slice of Life': '日常系',
    'Multiple Endings': 'マルチエンディング',
    'Choices': '選択肢',
    'Branching Plot': '分岐シナリオ',
    'Linear Plot': '一本道',
    'Point and Click': 'ポイント&クリック',
    'Sexual Content': '性的コンテンツ',
    'Eroge': 'エロゲ',
    'No Sexual Content': '性的コンテンツなし',
    'Violence': '暴力表現',
    'Gore': 'グロ表現',
    'Nakige': '泣きゲー',
    'Utsuge': '鬱ゲー',
    'Kinetic Novel': 'キネティックノベル',
    'Visual Novel': 'ビジュアルノベル',
    'RPG': 'RPG',
    'Simulation': 'シミュレーション',
    'Strategy': 'ストラテジー',
    'Puzzle': 'パズル',
    'Time Travel': 'タイムトラベル',
    'Supernatural': '超常現象',
    'Magic': '魔法',
    'War': '戦争',
    'Post-apocalyptic': 'ポストアポカリプス',
    'Cyberpunk': 'サイバーパンク',
    'Steampunk': 'スチームパンク',
    'Tsundere': 'ツンデレ',
    'Yandere': 'ヤンデレ',
    'Kuudere': 'クーデレ',
    'Childhood Friend': '幼馴染',
    'Maid': 'メイド',
    'Teacher': '教師',
    'Student': '学生',
}

# データベース接続設定
DB_CONFIG = {
    'dbname': os.getenv('POSTGRES_DB'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD'),
    'host': os.getenv('POSTGRES_HOST'),
    'port': os.getenv('POSTGRES_PORT')
}

def update_tag_translations():
    """
    既存のタグデータに name_ja フィールドを追加します
    """
    print("データベースに接続中...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    try:
        # 全ゲームのIDとタグを取得
        print("既存データを取得中...")
        cur.execute("SELECT id, tags FROM visual_novels WHERE tags IS NOT NULL")
        rows = cur.fetchall()
        
        print(f"対象ゲーム数: {len(rows)}件")
        
        # 各ゲームのタグを更新
        updated_count = 0
        for game_id, tags in rows:
            if not tags:  # タグがない場合スキップ
                continue
                
            # タグに name_ja を追加
            updated = False
            for tag in tags:
                tag_name = tag.get('name', '')
                # name_ja がまだない場合のみ追加
                if 'name_ja' not in tag:
                    tag['name_ja'] = TAG_TRANSLATIONS.get(tag_name, tag_name)
                    updated = True
            
            # 更新されたタグをデータベースに保存
            if updated:
                cur.execute(
                    "UPDATE visual_novels SET tags = %s WHERE id = %s",
                    (Json(tags), game_id)
                )
                updated_count += 1
                print(f"  更新: {game_id} ({updated_count}/{len(rows)})")
        
        # コミット（確定）
        conn.commit()
        print(f"\n✅ 完了！ {updated_count}件のゲームのタグを更新しました。")
        
    except Exception as e:
        # エラーが発生した場合はロールバック
        conn.rollback()
        print(f"❌ エラーが発生しました: {e}")
        raise
    finally:
        # 接続を閉じる
        cur.close()
        conn.close()

if __name__ == '__main__':
    print("=" * 60)
    print("タグ翻訳更新スクリプト")
    print("既存データに日本語翻訳（name_ja）を追加します")
    print("=" * 60)
    update_tag_translations()
