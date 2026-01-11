---
description: 開発環境の起動確認と立ち上げ
---

# 開発環境の起動確認ワークフロー

このワークフローは、開発を始める前にDocker・データベース・サーバーの状態を確認するためのものです。

## 1. Dockerコンテナの確認

```bash
docker ps | grep eroge-postgres
```

**期待される出力**: `eroge-postgres` という名前のコンテナが表示される

**もし表示されない場合**:
```bash
cd /home/rich/eroge-db
docker compose up -d
```

## 2. PostgreSQLデータベースの接続確認

```bash
docker exec -it eroge-postgres psql -U myuser -d erogedb -c "SELECT COUNT(*) FROM visual_novels;"
```

**期待される出力**: データ件数が表示される（例: 10）

## 3. Next.js開発サーバーの確認

```bash
lsof -ti:3000
```

**期待される出力**: プロセスIDが表示される（例: 12345）

**もし何も表示されない場合**:
```bash
cd /home/rich/eroge-db/frontend
npm run dev -- -H 0.0.0.0
```

## 4. ブラウザでアクセス

開発サーバーが起動したら、以下のURLにアクセス:

```
http://localhost:3000
```

**重要**: WSL環境では `192.168.x.x` ではなく `localhost` を使用してください。

## トラブルシューティング

### Dockerが起動しない
- Docker Desktopが起動しているか確認
- WSL統合が有効になっているか確認

### サーバーが起動しない
- ポート3000が他のプロセスで使用されていないか確認
- `npm install` を実行してみる

### データベースに接続できない
- Dockerコンテナが起動しているか確認
- `.env`ファイルの設定を確認
