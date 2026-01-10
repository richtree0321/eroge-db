# datetimeという、日付や時間を扱うための便利な道具箱（モジュール）をプログラムで使えるように読み込みます
import datetime

# 画面（コンソール）に "Hello Infrastructure Engineer!" という挨拶の言葉を表示します
print("Hello Infrastructure Engineer!")

# datetimeモジュールを使って、たった今の時間を取得し、それを current_time という名前の箱（変数）に入れます
current_time = datetime.datetime.now()

# current_time という箱に入っている、先ほど取得した現在の時間を画面に表示します
print(current_time)
