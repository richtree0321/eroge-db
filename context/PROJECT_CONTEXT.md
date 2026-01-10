# プロジェクト概要
エロゲ・AVのデータベースサイト構築プロジェクト。
最大の目的はプログラミングの学習です。
最終的にはアフィリエイト収益の自動化を目指す。
インフラエンジニア志望のため、AWS Lightsail (将来的にEC2+RDS) へのデプロイを見据えて開発する。

# 方針

プログラミング初学者が勉強にもなるようにコードの各行に解説をいれながらコードを書いてください
また一気に進めるのではなく、プログラミング初学者でも理解できるように少しずつ進めてください

# 技術スタック
- OS: Windows 11 + WSL2 (Ubuntu)
- Backend: Python 3.x (FastAPI or pure scripts for scraping)
- Frontend: Next.js (App Router) + Tailwind CSS
- DB: PostgreSQL
- Infrastructure: Docker / Docker Compose

# 現在の状況 (2026-01-10時点)
- WSL2 (Ubuntu) 環境構築完了、Python venv 導入済み。
- `requests` を使用したVNDB APIデータ取得スクリプト (`vndb_test.py`) 動作確認済み。
- Docker Compose による PostgreSQL サーバー (`eroge-postgres`) 構築完了。
- WSL接続不安定問題に対し、`.wslconfig` でメモリ12GB・Swap 8GBを割り当て、安定稼働を確認済み。
- Python (`psycopg2`) から PostgreSQL への接続テスト (`db_connection_test.py`) 成功。
- トラブルシューティングの知見をまとめたZenn用記事 (`zenn_wsl_trouble_shooting.md`) を作成済み。

# 次回のタスク
1. VNDB APIから取得したデータを整形し、PostgreSQLにINSERTするスクリプトを作成する。
   - Jupyter Notebook (`experiment.ipynb`) を活用してデータ加工ロジックを試行錯誤する。
2. データベースのテーブル設計（スキーマ定義）を行う。
3. Next.jsを導入して、DB内のデータをブラウザで表示する。

# 開発方針
- 「小さく作って動かす」を徹底する。
- いきなり完全な設計を目指さず、まずは動くものを作る。
- エラーが出たらログを読み解くプロセスを重視する。

# geminiリンク
https://gemini.google.com/share/5a1f931affac
