# プロジェクト概要

エロゲ・AV のデータベースサイト構築プロジェクト。
VNDB（Visual Novel Database）のダンプデータを活用し、**「不動産サイトのような爆速検索」** を実現することを目指しています。
最大の目的はプログラミングの学習（特に Next.js/PostgreSQL のパフォーマンスチューニング）です。

# 学習方針

**現在の学習フォーカス: 大規模データの高速検索と UI/UX 設計**

- **CQRS アーキテクチャ**: 検索用（高速）と詳細表示用（正規化）でデータ構造を分ける設計を実践中。
- **PostgreSQL 活用**: GIN インデックス、JSONB、ウィンドウ関数、CTE などの高度な SQL 機能を学びます。

# 技術スタック

- **OS**: Windows 11 + WSL2 (Ubuntu)
- **Database**: PostgreSQL 15 (Docker Compose)
  - `vndb` Schema: 公式ダンプデータの正規化テーブル群 (Raw Data)
  - `public.search_vns`: 検索用に非正規化した高速テーブル (Read Model)
- **Frontend**: Next.js 16.1.1 (App Router) + TypeScript + Tailwind CSS
- **Backend (Scripts)**: Python 3.x (補助ツール), Bash/SQL (データパイプライン)
- **Infrastructure**: Docker / Docker Compose

# 現在の状況 (2026-01-11 Milestone 3.5 完了)

## データ基盤 (PostgreSQL)

- **VNDB ダンプ移行完了**:
  - `vndb` スキーマを作成し、公式サイトの全データ（約 6 万作品、15 万キャラ）をインポート済み。
- **高速検索テーブル (`search_vns`) 実装**:
  - `tag_ids` (INTEGER 配列) + **GIN インデックス** により、数万件の中から特定タグを持つ作品を **0.5 ミリ秒** で検索可能。
  - ハイブリッド構成: 一覧表示は `search_vns`、詳細表示は `vndb` スキーマから遅延ロード。

## フロントエンド (Next.js)

- **一覧ページ (`/`)**:
  - `search_vns` テーブルから爆速でリスト表示。
  - 日本語タイトル優先表示、評価点表示、画像表示（バケット計算ロジック修正済み）。
  - ソートタブ UI 実装済み（評価順 / 人気順 / 新着順）。
- **詳細ページ (`/game/[id]`)** ✨ **強化済み**:
  - 正規化された `vndb` スキーマから都度 JOIN してデータを取得・表示。
  - **実装済み機能**:
    - 📖 基本情報（タイトル、評価スコア、投票数）
    - 🏷️ タグ一覧（vote > 0 のみ、20 件まで）
    - 📖 あらすじ（BBCode フィルタリング済み）
    - 🛠️ スタッフ情報（scenario, chardesign, art など役割別ソート）
    - 👤 キャラクター一覧（main/primary/side で役割別ソート、画像付き、24 件まで）
    - 🖼️ スクリーンショットギャラリー（12 枚まで）

## 技術的な成果

- **画像 URL 構築ロジック**: VNDB のバケット計算（`id % 100`）を正しく実装。
- **キャラクター画像**: `ch/` パス、スクリーンショット: `sf/` パス、カバー: `cv/` パス。
- **TypeScript 型定義**: `Character`, `Staff`, `SearchVN` などを `lib/types.ts` に定義済み。

# データベース設計 (Database Schema)

## 1. public.search_vns (高速検索用)

| 列名 (Column) | データ型  | 説明                          | インデックス |
| :------------ | :-------- | :---------------------------- | :----------- |
| **id**        | TEXT      | VN ID (例: "v11")             | PK           |
| **title**     | TEXT      | 英語タイトル                  |              |
| **title_ja**  | TEXT      | 日本語タイトル                |              |
| **rating**    | NUMERIC   | 評価点 (10 点満点)            | BTREE        |
| **votecount** | INTEGER   | 投票数                        | BTREE        |
| **tag_ids**   | INTEGER[] | タグ ID の配列                | **GIN**      |
| **cover_url** | TEXT      | パッケージ画像 URL            |              |
| **display**   | JSONB     | (将来用) 一覧表示用キャッシュ |              |

## 2. vndb.\* (Raw Data)

VNDB 公式ダンプ (`import.sql`) に準拠。
主なテーブル: `vn`, `vn_titles`, `tags`, `tags_vn`, `chars`, `chars_vns`, `vn_staff`, `staff_alias`, `vn_screenshots`, `images` など。

# 次のステップ (Milestone 4: Search UI)

1.  **高度な検索 UI の実装**
    - サイドバーでのタグ絞り込み
    - 評価点スライダー
    - 発売年フィルタ
2.  **ページネーション**
    - 現在は上位 100 件固定のため、全件閲覧可能にする
3.  **ソート機能の実装**
    - 一覧ページのソートタブを機能させる

# 開発開始時のチェックリスト

## 1. コンテナとサーバー起動

```bash
docker compose up -d
cd frontend && npm run dev -- -H 0.0.0.0
```

## 2. データベース接続確認

```bash
# search_vns テーブルの確認
docker exec -it eroge-postgres psql -U myuser -d erogedb -c "SELECT count(*) FROM search_vns;"
```

## 3. ブラウザでアクセス

```
http://localhost:3000
```
