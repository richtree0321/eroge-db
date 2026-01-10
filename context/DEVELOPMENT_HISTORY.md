# 開発ログ＆履歴 (DEVELOPMENT HISTORY)

## プロジェクト概要
- **目的**: エロゲ・AVのデータベースサイト構築とアフィリエイト収益化。
- **技術スタック**: Windows 11 + WSL2 (Ubuntu), Python, Docker (PostgreSQL), Next.js。
- **特徴**: インフラエンジニア視点での堅牢な環境構築と、AIペアプログラミングによる学習の実践。

---

## 2026-01-07: 環境構築とプロトタイピング【Phase 1】

### 1. WSL2 (Ubuntu) の導入
インフラエンジニア志望として、Windows上で直接開発するのではなく、本番環境(Linux)に近い **WSL2** を採用。
- `wsl --install -d Ubuntu` で環境構築。
- Windowsのエディタから `\\wsl$` 経由でLinuxファイルシステムにアクセスする構成を確立。

### 2. Python環境の整備と PEP 668 問題
`pip install` 時に `externally-managed-environment` エラーに直面。
- **学び**: Linuxシステム領域のPython環境を汚さないために、`venv` (仮想環境) の使用が必須であることを習得。
- `python3 -m venv .venv` でプロジェクト専用環境を作成し解決。

### 3. APIデータ取得の実装
VNDB (Visual Novel Database) APIを叩くスクリプト `vndb_test.py` を作成。
- ライブラリ: `requests`
- 成果: 「Fate/stay night」のデータ取得に成功。

---

## 2026-01-09: インフラ構築とDevOpsの実践【Phase 2】

### 1. Jupyter Notebook の導入
「実験（Jupyter）」と「本番実装（.py）」の使い分けを導入。
- 仮想環境内に `ipykernel` をインストールし、エディタ(Antigravity/Cursor)上からNotebookを実行する環境を整備。
- Windows/WSLのパス認識の違い (`Scripts` vs `bin`) によるカーネル選択トラブルが発生したが、エディタをWSLモードで正しく再接続することで解決。

### 2. Docker Compose による DBサーバー構築
`docker-compose.yml` を作成し、PostgreSQL 15環境をコードベースで定義 (IaC)。

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - ./postgres_data:/var/lib/postgresql/data # データ永続化
```

#### 直面したトラブルと解決策
1. **Dockerコマンドが見つからない**:
   - 原因: Docker Desktopの設定でWSL統合が無効だった。
   - 解決: Settings -> Resources -> WSL integration でUbuntuをONに設定。
2. **Permission denied (権限エラー)**:
   - 原因: 一般ユーザーにDockerデーモンへのアクセス権がない。
   - 解決: `sudo usermod -aG docker $USER` でユーザーをdockerグループに追加。

### 3. WSL接続不安定問題の調査
Antigravityのリモート接続が頻繁に切れる現象が発生。
- 調査: Dockerログを確認し、不正シャットダウン (`database system was not properly shut down`) の記録を発見。
- 対策1 (初期): メモリ6GB制限を適用したが、再度切断が発生。
- 対策2 (最終): ユーザーのPCメモリが32GBであることを考慮し、制限ではなく**「増強および確保」**の方針に変更。`.wslconfig` でメモリ12GB、Swap 8GBを割り当て、安定化に成功。
  - 学び: WSLの「メモリ食いつぶし」は単なる制限だけでなく、十分なリソース確保とのバランスが重要。

### 5. アウトプット（Zenn記事作成）
WSLトラブルの経験を風化させないため、記事 `zenn_wsl_trouble_shooting.md` を作成。
- テーマ: WSL2のメモリ枯渇問題と `.wslconfig` による解決。
- ポイント: PCスペックに応じた設定の使い分け（制限 vs 確保）。

### 4. DB接続テスト
アプリ(Python)からインフラ(DB)への接続を確認する `db_connection_test.py` を作成。
- `psycopg2` ライブラリを使用。
- `docker-compose.yml` で定義した認証情報 (`myuser/mypassword`) で接続し、バージョン情報を取得することに成功。

---

## 次のステップ
インフラ基盤が整ったため、アプリケーション開発フェーズへ移行します。
- **データ永続化**: APIから取得したデータをPostgreSQLに保存する。
- **Webフロントエンド**: Next.jsの導入。

---

## 2026-01-10: データパイプラインの構築【Phase 3】

### 1. データ構造の特定とテーブル設計
VNDB APIの仕様を確認し、`visual_novels` テーブルを設計しました。
- **JSONB型の活用**: 将来的な変更に強い柔軟な設計にするため、タグや開発者情報は `JSONB` カラムにそのままリストとして格納する方針を採用。

### 2. データ取得・保存スクリプトの実装
Pythonスクリプト `ingest_vndb_data.py` を作成し、ETL処理（Extract, Transform, Load）を実装中。
- **学習の重視**: コードの各行に詳細な日本語コメントを追加し、学習教材としての価値を高めました。
- **段階的な実装**:
  - ステップ1: DB接続とテーブル作成 (完了)
  - ステップ2: データの取得と保存 (実装完了・実行待ち)

### トラブルシューティング
- **現象**: `ModuleNotFoundError` や `Connection refused` が発生。
- **原因**: 仮想環境 (`.venv`) の使い忘れ、Dockerコンテナの未起動。
- **解決**:
  - 実行時は必ず `./.venv/bin/python ...` を使用する。
  - 作業開始前に `docker compose up -d` を確認する。

### 3. ソースコード管理の開始 (GitHub)
- プロジェクトをGitHubリポジトリ (`eroge-db`) で管理開始しました。
- `.gitignore` を設定し、仮想環境やDBデータなどの不要ファイルを排除。
- 初回コミット＆プッシュ完了。
