# 開発ログ: WSL接続安定化調査とDB接続テスト

**日付**: 2026-01-09
**担当**: Antigravity

## 概要
開発中にAntigravity（エディタのリモート接続）が頻繁に切断される現象が発生。
WSL2環境およびDockerコンテナの健全性を調査し、あわせてPostgreSQLへの接続テスト環境を整備した。

## 1. WSL接続切断の調査

### 調査内容
- **システムリソース**: `free`, `top` コマンドで確認。メモリ枯渇等の致命的なリソース不足は現時点では確認されず。
- **Dockerログ**: `eroge-postgres` コンテナのログを確認。
  - `database system was not properly shut down` という記録あり。
  - PCのスリープや予期せぬ再起動、あるいはリソース不足による強制終了の可能性が高い。
  - ただしPostgreSQLの自動リカバリ機能により、現在は正常に `Up` (稼働中) 状態であることを確認。

### 推奨対策
現時点では開発続行可能だが、今後も頻繁に切断が発生する場合、WSL2のメモリ使用量制限を行うことを推奨する。
Windows側のユーザーホームディレクトリ (`%UserProfile%`) に `.wslconfig` ファイルを作成し、以下のように最大メモリを制限することで安定する場合がある。

```ini
# .wslconfig の設定例
[wsl2]
memory=4GB
swap=8GB
```

## 2. DB接続テスト環境の構築

### 目的
インフラ（Docker）とアプリ（Python）の連携確認。およびJupyter Notebook環境での接続トラブル（カーネル選択ミスなど）の解消。

### 実施内容
- 接続確認用のPythonスクリプト `db_connection_test.py` を作成。
- `psycopg2` ライブラリを用いて、ローカルホスト(WSL)からDockerコンテナ内のデータベース(`erogedb`)への接続に成功。

### 成果物
- [db_connection_test.py](file:///home/rich/eroge-db/db_connection_test.py): 実行するとPostgreSQLのバージョンを表示して終了するスクリプト。

```bash
# 実行ログ例
$ python db_connection_test.py
--- 接続テスト開始 ---
✅ データベースへの接続に成功しました
📦 データベースバージョン: PostgreSQL 15.15 ...
--- 接続テスト終了: 正常 ---
```

## 次のステップ
- インフラ環境の動作確認が完了したため、VNDBから取得したデータを実際にデータベースへ保存する実装フェーズへ移行する。
