import psycopg2  # PostgreSQL接続用ライブラリをインポート
import sys  # システム終了などの標準機能を使うためのライブラリ

def test_connection():
    # 接続情報を辞書形式で定義
    config = {
        "user": "myuser",  # ユーザー名
        "password": "mypassword",  # パスワード
        "host": "localhost",  # ホスト名 (Docker Desktopによりlocalhostでアクセス可能)
        "port": "5432",  # ポート番号
        "database": "erogedb"  # データベース名
    }

    try:
        # 定義した設定を使ってデータベースへの接続を試みる
        conn = psycopg2.connect(**config)
        
        # SQLを実行するためのカーソル（操作用オブジェクト）を作成
        cur = conn.cursor()
        
        # データベースのバージョン情報を取得するSQLを実行
        cur.execute("SELECT version();")
        
        # 実行結果（バージョン情報）を1行取得
        version = cur.fetchone()
        
        # 取得したバージョン情報を表示
        print(f"✅ 接続成功！ DB Version: {version[0]}")
        
        # カーソルを閉じる
        cur.close()
        
        # 接続を閉じる
        conn.close()
        
    except Exception as e:
        # エラーが発生した場合、エラー内容を表示
        print(f"❌ 接続失敗: {e}")
        # 異常終了ステータス(1)でプログラムを終了
        sys.exit(1)

if __name__ == "__main__":
    test_connection()  # テスト関数を実行
