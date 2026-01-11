https://gemini.google.com/app/c9570b321809e4a0?hl=ja



Antigravity × WSL 再接続不能時の復旧手順書
症状：

「再接続できません（Cannot reconnect）」と言われる

「install script returned non-zero exit status」が出る

ウィンドウの再読み込みを要求されるが、繰り返しても直らない

レベル1：まずはプロセスの完全リセット（所要時間：1分）
ゾンビプロセス（終了しきれずに残ったプログラム）が悪さをしている場合の対処です。

Windows側でAntigravity（エディタ）を全て閉じる。

PowerShellで以下を実行し、WSLを強制停止する。

PowerShell

wsl --shutdown
Antigravityを再度開き、接続できるか試す。

これだけで直ることが8割です。

レベル2：サーバープログラムのクリーンインストール（所要時間：3分）
WSL側のサーバーファイルが破損した場合や、アップデート後の不整合が起きた場合の対処です。

WSLのターミナル（Ubuntuのアイコンから開く）を立ち上げる。

以下のコマンドをコピー＆ペーストして実行する（Antigravityのサーバー関連ファイルを全消去）。

Bash

rm -rf ~/.antigravity
rm -rf ~/.config/antigravity
rm -rf ~/.cache/antigravity
※もしVS Codeも併用していてそちらもおかしい場合は rm -rf ~/.vscode-server も追加。

Antigravityを立ち上げ、接続する（自動で再ダウンロード・構築が始まります）。

レベル3：ネットワーク設定の再確認（所要時間：5分）
「install script error」が出る場合や、ダウンロードが進まない場合です。

WSLのターミナルで ping google.com を打ってみる。

通らない場合： .wslconfig の設定が今のWindows環境と合わなくなっています。

Windows側で C:\Users\ユーザー名\.wslconfig を開く。

networkingMode=mirrored の記述を確認する。

もし記述があるのに繋がらないなら、一時的に # でコメントアウトしてみる。

もし記述がないなら、追記してみる（今回の解決策）。

設定変更後は必ず wsl --shutdown を実行する。

レベル4：メモリ不足（OOM Killer）の確認
重い処理を実行した後に切断された場合です。

WSLのターミナルで以下を実行。

Bash

dmesg | grep -i "kill"
直近の時刻で Out of memory: Kill process というログが出ていたら、メモリ不足です。

Dockerコンテナを減らすか、.wslconfig のメモリ割り当てを増やす検討が必要です。

【重要】再発を防ぐための運用ルール
「Windowsをスリープにする前」や「作業終了時」 に、以下の手順で終了させると、サーバーファイルが破損する確率をグッと下げられます。

ウィンドウ右上の × でいきなり閉じない。

左下の [WSL: Ubuntu] インジケータをクリックする。

[リモート接続を閉じる (Close Remote Connection)] を選択する。

スタート画面に戻ってから、Antigravityを終了する。

この手順書さえあれば、次回同じことが起きても「あ、いつものやつね」と5分で復旧できます。