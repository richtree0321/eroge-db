import psycopg2  # PostgreSQLに接続するためのライブラリを読み込む
import time  # 時間計測や待機を行うためのライブラリを読み込む

def test_db_connection():
    # 接続情報を辞書として定義する（docker-compose.ymlの設定と合わせる）
    connection_config = {
        "user": "myuser",        # ユーザー名
        "password": "mypassword", # パスワード
        "host": "localhost",     # ホスト名（ローカル環境なのでlocalhost）
        "port": "5432",          # ポート番号（PostgreSQLのデフォルトは5432）
        "database": "erogedb"    # データベース名
    }

    try:
        print("--- 接続テスト開始 ---") # 開始メッセージを表示

        # 定義した接続情報を使ってデータベースに接続する
        # **connection_config は辞書の中身を展開して引数として渡す記法
        conn = psycopg2.connect(**connection_config)
        print("✅ データベースへの接続に成功しました")

        # SQLを実行するためのカーソル（操作用オブジェクト）を作成する
        cur = conn.cursor()

        # 実行するSQL文：PostgreSQLのバージョン情報を取得する
        cur.execute("SELECT version();")

        # SQLの実行結果を1行取得する
        version = cur.fetchone()
        print(f"📦 データベースバージョン: {version[0]}") # 取得したバージョンを表示

        # カーソルを閉じる（後始末）
        cur.close()
        # 接続を閉じる（後始末）
        conn.close()
        print("--- 接続テスト終了: 正常 ---")

    except Exception as e:
        # エラーが発生した場合の処理
        print("❌ 接続に失敗しました")
        print(f"エラー内容: {e}") # エラーの詳細を表示

if __name__ == "__main__":
    # スクリプトとして直接実行された場合にテスト関数を呼び出す
    test_db_connection()
