# 開発ログ＆履歴 (DEVELOPMENT HISTORY)

## プロジェクト概要

- **目的**: エロゲ・AV のデータベースサイト構築とアフィリエイト収益化。
- **技術スタック**: Windows 11 + WSL2 (Ubuntu), Python, Docker (PostgreSQL), Next.js。
- **特徴**: インフラエンジニア視点での堅牢な環境構築と、AI ペアプログラミングによる学習の実践。

---

## 2026-01-07: 環境構築とプロトタイピング【Phase 1】

### 1. WSL2 (Ubuntu) の導入

インフラエンジニア志望として、Windows 上で直接開発するのではなく、本番環境(Linux)に近い **WSL2** を採用。

- `wsl --install -d Ubuntu` で環境構築。
- Windows のエディタから `\\wsl$` 経由で Linux ファイルシステムにアクセスする構成を確立。

### 2. Python 環境の整備と PEP 668 問題

`pip install` 時に `externally-managed-environment` エラーに直面。

- **学び**: Linux システム領域の Python 環境を汚さないために、`venv` (仮想環境) の使用が必須であることを習得。
- `python3 -m venv .venv` でプロジェクト専用環境を作成し解決。

### 3. API データ取得の実装

VNDB (Visual Novel Database) API を叩くスクリプト `vndb_test.py` を作成。

- ライブラリ: `requests`
- 成果: 「Fate/stay night」のデータ取得に成功。

---

## 2026-01-09: インフラ構築と DevOps の実践【Phase 2】

### 1. Jupyter Notebook の導入

「実験（Jupyter）」と「本番実装（.py）」の使い分けを導入。

- 仮想環境内に `ipykernel` をインストールし、エディタ(Antigravity/Cursor)上から Notebook を実行する環境を整備。
- Windows/WSL のパス認識の違い (`Scripts` vs `bin`) によるカーネル選択トラブルが発生したが、エディタを WSL モードで正しく再接続することで解決。

### 2. Docker Compose による DB サーバー構築

`docker-compose.yml` を作成し、PostgreSQL 15 環境をコードベースで定義 (IaC)。

```yaml
services:
  db:
    image: postgres:15
    volumes:
      - ./postgres_data:/var/lib/postgresql/data # データ永続化
```

#### 直面したトラブルと解決策

1. **Docker コマンドが見つからない**:
   - 原因: Docker Desktop の設定で WSL 統合が無効だった。
   - 解決: Settings -> Resources -> WSL integration で Ubuntu を ON に設定。
2. **Permission denied (権限エラー)**:
   - 原因: 一般ユーザーに Docker デーモンへのアクセス権がない。
   - 解決: `sudo usermod -aG docker $USER` でユーザーを docker グループに追加。

### 3. WSL 接続不安定問題の調査

Antigravity のリモート接続が頻繁に切れる現象が発生。

- 調査: Docker ログを確認し、不正シャットダウン (`database system was not properly shut down`) の記録を発見。
- 対策 1 (初期): メモリ 6GB 制限を適用したが、再度切断が発生。
- 対策 2 (最終): ユーザーの PC メモリが 32GB であることを考慮し、制限ではなく**「増強および確保」**の方針に変更。`.wslconfig` でメモリ 12GB、Swap 8GB を割り当て、安定化に成功。
  - 学び: WSL の「メモリ食いつぶし」は単なる制限だけでなく、十分なリソース確保とのバランスが重要。

### 5. アウトプット（Zenn 記事作成）

WSL トラブルの経験を風化させないため、記事 `zenn_wsl_trouble_shooting.md` を作成。

- テーマ: WSL2 のメモリ枯渇問題と `.wslconfig` による解決。
- ポイント: PC スペックに応じた設定の使い分け（制限 vs 確保）。

### 4. DB 接続テスト

アプリ(Python)からインフラ(DB)への接続を確認する `db_connection_test.py` を作成。

- `psycopg2` ライブラリを使用。
- `docker-compose.yml` で定義した認証情報 (`myuser/mypassword`) で接続し、バージョン情報を取得することに成功。

---

## 次のステップ

インフラ基盤が整ったため、アプリケーション開発フェーズへ移行します。

- **データ永続化**: API から取得したデータを PostgreSQL に保存する。
- **Web フロントエンド**: Next.js の導入。

---

## 2026-01-10: データパイプラインの構築【Phase 3】

### 1. データ構造の特定とテーブル設計

VNDB API の仕様を確認し、`visual_novels` テーブルを設計しました。

- **JSONB 型の活用**: 将来的な変更に強い柔軟な設計にするため、タグや開発者情報は `JSONB` カラムにそのままリストとして格納する方針を採用。

### 2. データ取得・保存スクリプトの実装

Python スクリプト `ingest_vndb_data.py` を作成し、ETL 処理（Extract, Transform, Load）を実装中。

- **学習の重視**: コードの各行に詳細な日本語コメントを追加し、学習教材としての価値を高めました。
- **段階的な実装**:
  - ステップ 1: DB 接続とテーブル作成 (完了)
  - ステップ 2: データの取得と保存 (実装完了・実行待ち)

### トラブルシューティング

- **現象**: `ModuleNotFoundError` や `Connection refused` が発生。
- **原因**: 仮想環境 (`.venv`) の使い忘れ、Docker コンテナの未起動。
- **解決**:
  - 実行時は必ず `./.venv/bin/python ...` を使用する。
  - 作業開始前に `docker compose up -d` を確認する。

### 3. ソースコード管理の開始 (GitHub)

- プロジェクトを GitHub リポジトリ (`eroge-db`) で管理開始しました。
- `.gitignore` を設定し、仮想環境や DB データなどの不要ファイルを排除。
- 初回コミット＆プッシュ完了。

---

## 2026-01-10: Web フロントエンド構築【Phase 4】

### 1. セキュリティ強化（環境変数化）

**背景**: リポジトリを Public にするため、パスワード等の機密情報をコードから排除する必要がありました。

**実装内容**:

- `.env` ファイルを作成し、データベース接続情報を環境変数で管理
- `python-dotenv` ライブラリを導入
- Python 側のスクリプト (`ingest_vndb_data.py`, `db_connection_test.py` など) を `os.getenv()` を使用する形に修正
- `docker-compose.yml` も環境変数を参照する形に変更

### 2. プロジェクトの整理

- 不要な実験用ファイルを削除 (`main.py`, `vndb_test.py`, `db_test.ipynb` など)
- ディレクトリ構成をクリーンに保ち、本番に向けた準備

### 3. Next.js 環境構築

**技術選定の理由**:

- **Node.js (v24.12.0)**: JavaScript 実行環境
- **nvm (Node Version Manager)**: バージョン管理ツール（インフラエンジニアらしい環境構築）
- **Next.js 16.1.1**: React ベースのフルスタックフレームワーク
  - App Router 採用（最新のルーティング方式）
  - TypeScript 対応（型安全性）
  - Tailwind CSS 統合（高速なスタイリング）

**構築手順**:

1. nvm のインストール (`curl` 経由)
2. Node.js LTS のインストール
3. `create-next-app` でプロジェクト作成（`frontend` ディレクトリ）
4. 開発サーバーの起動確認

**WSL ネットワーク問題の解決**:

- Windows ブラウザから WSL 内の localhost に接続できない問題が発生
- 解決策: WSL のネットワーク IP アドレス (`172.23.92.20:3000`) を使用

### 4. データベース統合（フルスタック化）

**目標**: PostgreSQL のデータをブラウザで表示する

**実装内容**:

- `pg` ライブラリのインストール（PostgreSQL 接続用ドライバ）
- `@types/pg` で TypeScript 型定義を追加
- `.env.local` ファイルでデータベース接続情報を管理
- `app/page.tsx` を実装:
  - データベース接続プール (`Pool`) の作成
  - SQL クエリでゲーム情報を取得 (`SELECT id, title, rating, image_url ...`)
  - React/Next.js の Server Components でデータを表示
  - Tailwind CSS でカード UI 実装

**学習ポイント**:

- 各行に詳細な日本語コメントを追加（初学者でも理解できるように）
- Python の Psycopg2 と Node.js の pg ライブラリの対応関係を明示
- JSX の書き方、TypeScript の型定義、Tailwind CSS のクラス名など丁寧に解説

### 5. 画像表示機能の追加

- パッケージ画像 (`image_url`) をデータベースから取得
- 各ゲームカードに画像とテキストを横並びで表示
- Flexbox レイアウトで整理された見た目を実現

**完成した機能**:

- トップページ (`http://172.23.92.20:3000`) でゲーム一覧表示
- 評価点の高い順に 10 件表示
- 各カードにパッケージ画像、タイトル、評価点を表示

---

## 達成したマイルストーン

**VNDB → Python → PostgreSQL → Next.js → ブラウザ** という完全なパイプラインが貫通しました。

これにより、以下の技術スタックを実践的に習得：

- **バックエンド**: Python (データ取得・加工)
- **データベース**: PostgreSQL (Docker Compose)
- **フロントエンド**: Next.js (TypeScript + Tailwind CSS)
- **インフラ**: WSL2, Docker, GitHub
- **開発手法**: 環境変数管理、バージョン管理、段階的実装

---

## 次のステップ候補

- タグ情報の表示（JSONB 活用）
- 検索・フィルタ機能
- ページネーション（100 件以上のデータ表示）
- デプロイ準備（AWS Lightsail への展開）

---

## 2026-01-11: タグ情報の詳細調査と日本語化対応【Phase 5】

### 1. タグ情報の調査 (API Investigation)

VNDB のタグシステムを理解し、日本語検索に対応するための調査を行いました。

- **`investigate_tag_api.py`**:

  - 人気タグ（Top 20）を取得し、データ構造を確認。
  - **発見**: VNDB の API が返すデータには、残念ながら日本語のタグ名（`name_ja`など）が含まれていないことが判明。
  - 結論: 日本語で検索・表示するためには、自前で翻訳マッピングを持つ必要がある。

- **`count_all_tags.py`**:
  - 全タグ数を把握するためにページング処理を用いたカウントスクリプトを作成。
  - **結果**: 2900 件以上のタグが存在することが判明。
  - 戦略: 全てを翻訳するのは現実的ではないため、主要なタグ（ジャンル、システム、属性など）を優先的に翻訳し、残りは英語のまま扱う方針を採用。

### 2. タグ翻訳機能の実装

データベースに保存された既存のタグ情報に対して、日本語訳を追加する仕組みを構築しました。

- **`update_tag_translations.py`**:
  - 独自の翻訳辞書（`TAG_TRANSLATIONS`）を定義。
    - 例: `Adv` → `アドベンチャー`, `School Life` → `学校生活`, `Tsundere` → `ツンデレ`
  - データベース内の `visual_novels` テーブルを走査し、各ゲームの `tags` (JSONB) カラム内の各タグに対し、辞書にマッチする場合に `name_ja` フィールドを追加して更新する処理を実装。
  - **学習ポイント**: JSONB データの更新方法（Python 辞書として操作し、再度 JSON として保存）を実践。

### 3. 全タグデータの保存

詳細な分析用として、全タグデータを一括取得して保存しました。

- `vndb-tags-2026-01-10.json`: タグ情報のマスターデータとして保存（約 1.3MB）。

---

## 2026-01-11: 爆速検索システムの実装とVNDBダンプ移行【Phase 6】

### 1. アーキテクチャの刷新 (Architecture Refactoring)

API取得方式（ingest_vndb_data.py）では、データ取得速度と網羅性（全詳細データ）に限界がありました。
ユーザーの「不動産サイトのような爆速検索」という要望を実現するため、抜本的なアーキテクチャ変更を行いました。

- **旧構成**: Python取得スクリプト -> isual_novels (JSONB詰め込み)
- **新構成**: VNDB公式ダンプ -> ndb Schema (Raw Data) -> search_vns (高速検索テーブル)

### 2. データ移行 (Migration)

#### VNDBダンプのインポート
公式サイトから提供されているPostgreSQL用ダンプを活用。
- **課題**: import.sql がデフォルトで public スキーマを使うため、既存テーブルと衝突する。
- **解決**: CREATE SCHEMA vndb を追加し、search_path を設定することで、ndb.* という名前空間に隔離してインポートすることに成功。
- **成果**: 約6万作品、15万キャラクター、3,000タグの完全なデータをDBに格納。

#### ハイブリッド検索テーブル設計 (CQRS)

検索専用のテーブル search_vns を新設しました。

- **検索用 (search_vns)**:
  - 	ag_ids を INTEGER[] 配列で保持し、**GINインデックス** を作成。
  - これにより「タグID: 10 と 24 を含む」という検索が **0.5ミリ秒** で完了（以前の全走査とは桁違いの速度）。
- **詳細用 (ndb.*)**:
  - 詳細ページでは、正規化された生のテーブル (ndb.vn, ndb.vn_titles 等) を都度JOINしてデータを取得。
  - これにより、データの重複を持たず、常に正確な詳細情報を表示可能に。

### 3. フロントエンドの対応

Next.js アプリケーションを新DB構造に対応させました。

- **一覧ページ**: search_vns からデータを取得し、日本語タイトル優先表示、評価点表示を実装。
- **詳細ページ**: ndb スキーマからデータを取得するように全面書き換え。
- **画像URLのバケット計算ロジック修正**:
  - VNDBの画像サーバー (s2.vndb.org) の仕様が「IDの末尾2桁 (id % 100)」でフォルダ分けされていることを特定し、URL生成ロジックを修正。
  - 例: ID 88391 -> cv/91/88391.jpg

これにより、6万件のデータに対する瞬時の検索と、リッチな詳細表示を両立することに成功しました。
