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
- Backend: Python 3.x (データ取得・ETL処理)
- Frontend: Next.js 16.1.1 (App Router) + TypeScript + Tailwind CSS
- DB: PostgreSQL 15
- Infrastructure: Docker / Docker Compose
- Node.js: v24.12.0 (nvm管理)
- バージョン管理: Git / GitHub

# 現在の状況 (2026-01-10時点)

## インフラ・環境
- WSL2 (Ubuntu) 環境構築完了、Python venv 導入済み
- Docker Compose による PostgreSQL 15 サーバー (`eroge-postgres`) 稼働中
- WSL安定化: `.wslconfig` でメモリ12GB・Swap 8GB割り当て済み
- Node.js v24.12.0 (nvm経由) インストール済み

## バックエンド (Python)
- VNDB APIデータ取得スクリプト (`ingest_vndb_data.py`) 実装完了
- PostgreSQLへのデータ投入成功 (10件のゲーム情報を保存)
- 環境変数化 (`.env` + `python-dotenv`) によるセキュリティ対策実施

## フロントエンド (Next.js)
- Next.js 16.1.1 プロジェクト作成完了 (`frontend/`)
- PostgreSQL接続 (`pg` ライブラリ) 実装済み
- トップページでゲーム一覧表示機能実装
  - パッケージ画像付きカード表示
  - 評価点順ソート機能
  - アクセスURL: `http://172.23.92.20:3000` (WSLネットワークIP)

## バージョン管理
- GitHubリポジトリ (`eroge-db`) で管理中
- セキュリティ対策として環境変数ファイルを `.gitignore` で除外済み

# 次のステップ候補
1. **UI/UX強化**
   - タグ情報の表示（JSONB型データの活用）
   - レスポンシブデザインの改善
   - 詳細ページの実装
2. **機能追加**
   - 検索・フィルタ機能（タイトル検索、評価点フィルタなど）
   - ページネーション（より多くのデータ表示）
3. **データ拡充**
   - データ件数を10件→100件以上に増やす
4. **デプロイ準備**
   - AWS Lightsail / EC2 + RDS への展開を検討

# 開発方針
- 「小さく作って動かす」を徹底する。
- いきなり完全な設計を目指さず、まずは動くものを作る。
- エラーが出たらログを読み解くプロセスを重視する。

# geminiリンク
https://gemini.google.com/share/5a1f931affac

# データベース設計 (Database Schema)

## visual_novels (ゲーム情報)

| 列名 (Column) | データ型 (Type) | 説明 (意味) |
| :--- | :--- | :--- |
| **id** | VARCHAR(50) | ゲームID (主キー)。例: "v11" |
| **title** | TEXT | タイトル |
| **alttitle** | TEXT | 別名 (ローマ字表記など) |
| **released** | DATE | 発売日 |
| **description** | TEXT | 説明文・あらすじ |
| **image_url** | TEXT | メイン画像のURL |
| **image_sexual** | REAL | 性的コンテンツの度合い (0.0〜2.0) |
| **image_violence** | REAL | 暴力コンテンツの度合い (0.0〜2.0) |
| **rating** | REAL | ユーザー評価点 (100点満点など) |
| **votecount** | INTEGER | 投票数 |
| **tags** | JSONB | タグ情報 (リスト形式で保存) |
| **developers** | JSONB | 開発会社情報 (リスト形式で保存) |
| **screenshots** | JSONB | スクリーンショットURL一覧 |
| **updated_at** | TIMESTAMP | データ更新日時 |
