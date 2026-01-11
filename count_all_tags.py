import requests
import json

# VNDB の全タグ数を正確に調査する（ページング方式）

url = 'https://api.vndb.org/kana/tag'
headers = {'Content-Type': 'application/json'}

print("=== VNDB 全タグ数を調査 ===\n")

total_tags = 0
page = 1
page_size = 100  # 1ページ100件

while True:
    payload = {
        "filters": ["search", "=", ""],
        "fields": "id",
        "results": page_size,
        "page": page
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        count = len(data['results'])
        total_tags += count
        
        print(f"ページ {page}: {count}件取得（累計: {total_tags}件）")
        
        # more=False なら終了
        if not data.get('more', False):
            print(f"\n【結論】VNDBの総タグ数: {total_tags}件")
            break
            
        page += 1
        
        # 安全のため、10ページで打ち切り
        if page > 10:
            print(f"\n【注意】10ページ（1000件）で調査を打ち切りました")
            print(f"少なくとも {total_tags}件以上のタグが存在します")
            break
    else:
        print(f"エラー: {response.status_code}")
        print(response.text)
        break

# カテゴリ別の内訳
print("\n=== カテゴリ別タグ数 ===")
for category_name, category_code in [("コンテンツ", "cont"), ("性的", "ero"), ("技術的", "tech")]:
    payload = {
        "filters": ["category", "=", category_code],
        "fields": "id",
        "results": 100
    }
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        count = len(data['results'])
        more = " (100件以上)" if data.get('more') else ""
        print(f"{category_name} ({category_code}): {count}件{more}")
