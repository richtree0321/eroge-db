import requests
import json

# VNDB APIから詳細情報を取得して、データ構造を確認するスクリプト

def inspect_data():
    # VNDB APIのエンドポイント
    url = 'https://api.vndb.org/kana/vn'

    # 取得したいフィールドを網羅的に指定します
    # 基本情報、画像、説明、タグ、開発元など
    fields = [
        "id",
        "title",
        "alttitle",
        "released",
        "description",
        "image.url",       # メイン画像のURL
        "image.sexual",    # 成人向け度合い
        "image.violence",  # 暴力表現度合い
        "screenshots.url", # スクリーンショットのURL
        "tags.name",       # タグの名前
        "tags.rating",     # タグの関連度
        "developers.name", # 開発会社名
        "rating",          # 平均スコア
        "votecount",       # 投票数
        "length",          # プレイ時間目安
        "languages"        # 対応言語
    ]
    
    # 検索条件：ID 'v11' (Fate/stay night) を指定して確実にデータを取得
    payload = {
        "filters": ["id", "=", "v11"],
        "fields": ", ".join(fields)
    }

    headers = {'Content-Type': 'application/json'}

    print("--- VNDB API データ構造確認 ---")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        # エラー時のレスポンス詳細を表示
        if response.status_code != 200:
            print(f"Error Code: {response.status_code}")
            print(f"Error Response: {response.text}")
        
        response.raise_for_status()
        
        data = response.json()
        
        # 取得したデータをJSON形式で見やすく整形して表示・保存
        if 'results' in data and len(data['results']) > 0:
            result = data['results'][0]
            
            # コンソールに見やすく表示
            print(json.dumps(result, indent=4, ensure_ascii=False))
            
            # ファイルにも保存（後でゆっくり見るため）
            with open('vndb_sample.json', 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=4, ensure_ascii=False)
            print("\n詳細データを 'vndb_sample.json' に保存しました。")
            
        else:
            print("データが見つかりませんでした。")

    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == '__main__':
    inspect_data()
