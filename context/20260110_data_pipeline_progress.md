# 2026-01-10 開発ログ：データ取得・保存パイプラインの構築

## 現在の状況
VNDB APIからデータを取得し、PostgreSQLに保存するパイプラインの基礎構築を行っています。
「小さく作る」方針に従い、まずはテーブル作成と基本的なデータの保存処理を実装しています。

## 実施した作業

### 1. データ構造の調査 (`inspect_data_structure.py`)
- VNDB APIのエンドポイント `https://api.vndb.org/kana/vn` に対してリクエストを送り、レスポンスのJSON構造を確認しました。
- `image.cover` など存在しないフィールドを指定してエラーになる問題を修正し、正しいフィールドリストを特定しました。

### 2. テーブル設計
- 開発効率を重視し、JSONB型を多用するテーブル `visual_novels` を設計しました。
- **Schema**:
  - `id` (PK): VNDB ID (v11など)
  - `title`: タイトル
  - `image_url`: 画像URL
  - `tags` (JSONB): タグ情報リスト
  - `developers` (JSONB): 開発者情報リスト
  - ...他

### 3. 実装とトラブルシューティング (`ingest_vndb_data.py`)

#### トラブル1: `ModuleNotFoundError`
- **現象**: `python ingest_vndb_data.py` を実行するとライブラリが見つからないエラーが発生。
- **原因**: 仮想環境 (`.venv`) のPythonを使わず、システム標準のPythonを実行していたため。
- **解決**: `./.venv/bin/python ingest_vndb_data.py` のように完全パスで指定して実行するよう修正（またはアクティベートする）。

#### トラブル2: `Connection refused`
- **現象**: データベース接続時に「接続拒否」エラーが発生。
- **原因**: Dockerコンテナ (`eroge-postgres`) が起動していなかった。
- **解決**: `docker compose up -d` を実行してDBサーバーを起動。

### 4. 成果物
- **`ingest_vndb_data.py`**:
  - 初学者向けに、各行に詳細な日本語コメントを付記。
  - 現在は「ステップ2（データ取得＆保存）」までコードを記述済み。
  - まだ実行確認は `create_table` まで完了。次はデータ保存の実行待ち。

## 次のアクション
- `ingest_vndb_data.py` を実行し、VNDBからトップ10件のデータが実際にDBに格納されることを確認する。
- DBクライアントやクエリでデータの中身を確認する。
