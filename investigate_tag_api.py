import requests
import json

# より多くのタグを調査する

url = 'https://api.vndb.org/kana/tag'
headers = {'Content-Type': 'application/json'}

# 人気の日本語ノベルゲームでよく使われるタグを調査
tag_ids = ["g7", "g36", "g542", "g249", "g803"]  # Horror, Romance, ADV, School Life, Fantasy

payload = {
    "filters": ["search", "=", ""],  # 全タグを対象
    "fields": "id, name, aliases, description",
    "sort": "vn_count",
    "reverse": True,
    "results": 20  # 人気トップ20を取得
}

print("=== 人気タグ トップ20 を取得 ===")
response = requests.post(url, headers=headers, json=payload)

if response.status_code == 200:
    data = response.json()
    
    print(f"\n取得したタグ数: {len(data['results'])}\n")
    
    for i, tag in enumerate(data['results'][:10], 1):
        print(f"{i}. ID: {tag['id']}")
        print(f"   Name: {tag['name']}")
        print(f"   Aliases: {tag.get('aliases', [])}")
        if tag.get('description'):
            desc_preview = tag['description'][:100] + "..." if len(tag['description']) > 100 else tag['description']
            print(f"   Description: {desc_preview}")
        print()
        
    # 日本語文字が含まれているか確認
    has_japanese = False
    for tag in data['results']:
        text = ' '.join([tag['name']] + tag.get('aliases', []))
        if any('\u3040' <= char <= '\u309F' or '\u30A0' <= char <= '\u30FF' or '\u4E00' <= char <= '\u9FFF' for char in text):
            has_japanese = True
            print(f"【発見】日本語を含むタグ: {tag}")
            
    if not has_japanese:
        print("【結論】日本語フィールドは見つかりませんでした")
else:
    print(f"エラー: {response.status_code}")
    print(response.text)
