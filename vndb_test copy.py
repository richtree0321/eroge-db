# 必要なライブラリ：requests
# インストールコマンド： pip install requests
# もしWSL環境などでpipが入っていない場合は、 sudo apt install python3-requests もしくは sudo apt install python3-pip でpipを入れてからインストールしてください。

# "requests" という、インターネット上のデータを取得するための道具箱（ライブラリ）を読み込みます
import requests
# データの整形表示用（必須ではありませんが、見やすくするために使用します）
import json

def search_vndb():
    # VNDBのAPIの場所（URL）を指定します。「ここにお手紙（リクエスト）を送ってね」という宛先です
    url = 'https://api.vndb.org/kana/character'

    # 送るデータの中身（手紙の内容）を作ります
    # 'filters': 具体的な検索条件です。ここでは「search」（検索）でキーワード「Fate/stay night」を指定しています
    # 'fields': 欲しい情報のリストです。「title」（タイトル）、「released」（発売日）、「rating」（評価点）をくださいとお願いします
    payload = {
        'filters': ['search', '=', '遠坂凛'],
        'fields': 'name, original, description, image.sexual, bust, waist, hips'
    }

    # 実際にリクエストを送る準備をします。ヘッダー情報は「これはプログラムからのアクセスですよ」と伝える名札のようなものです
    headers = {'Content-Type': 'application/json'}

    print("検索を開始します...")

    try:
        # requests.postを使って、指定したURLにデータ（payload）を送ります
        # json=payload とすることで、Pythonのデータを自動的にJSON形式（Webでよく使われる形式）に変換して送ってくれます
        response = requests.post(url, headers=headers, json=payload)

        # サーバーからの返事（ステータスコード）をチェックします
        # 200番台なら「成功」という意味です。それ以外ならエラーが発生しているので、例外（エラー）を発生させます
        response.raise_for_status()

        # 返ってきたデータ（JSON形式）を、Pythonで扱える辞書やリストの形に変換して受け取ります
        data = response.json()
        # デバッグ用：取得した全データを表示してみる
        print("--- 取得した生データ ---")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("------------------------")

        # 結果が見つかったかどうかを確認します
        if 'results' in data and len(data['results']) > 0:
            print(f"検索結果が見つかりました: {len(data['results'])}件")
            print("-" * 30)
            
            # 見つかった結果をひとつずつ取り出して表示します
            for item in data['results']:
                # 名前を取り出します。なければ "不明" とします
                name = item.get('name', '不明')
                # 原語表記（日本語名など）を取り出します
                original = item.get('original', '不明')
                
                # 説明文を取り出します。長い場合があるので最初の50文字だけ表示するなど工夫もできますが、今回はそのまま出します
                description = item.get('description', 'なし')
                
                # 画像の性的強度（sexual rating）を取得します
                # imageフィールドの中に辞書として入ってくるので、少し注意が必要です
                image_info = item.get('image')
                if image_info:
                    sexual_rating = image_info.get('sexual', '不明')
                else:
                    sexual_rating = '画像なし'
                
                # スリーサイズを取り出します。情報がない場合はNoneなどが返る可能性があります
                bust = item.get('bust', '不明')
                waist = item.get('waist', '不明')
                hips = item.get('hips', '不明')

                # 画面に見やすく表示します
                print(f"名前    : {name}")
                print(f"原語表記: {original}")
                print(f"画像R指定: {sexual_rating}")
                print(f"バスト  : {bust}")
                print(f"ウエスト: {waist}")
                print(f"ヒップ  : {hips}")
                # 説明文は見やすいように最後に改行を入れて表示します
                print(f"説明文  : {description}")
                print("-" * 30)
        else:
            print("該当するキャラクターは見つかりませんでした。")

    except requests.exceptions.RequestException as e:
        # 通信エラーやサーバーエラーが起きた場合にここに来ます
        print(f"エラーが発生しました: {e}")
    except json.JSONDecodeError:
        # 返ってきたデータがJSON形式でなかった（壊れていた）場合にここに来ます
        print("データの解析に失敗しました。")
    except Exception as e:
        # 予期せぬその他のエラーが起きた場合にここに来ます
        print(f"予期せぬエラーが発生しました: {e}")

# このファイルが直接実行されたときだけ、search_vndb関数を動かします
if __name__ == '__main__':
    search_vndb()
