// ========================================
// データベース接続プールの共通モジュール
// ========================================
//
// このファイルは PostgreSQL への接続プールを一元管理します。
// Next.js の HMR（Hot Module Replacement）やサーバーレス環境で
// プールが乱立するのを防ぐため、globalThis にキャッシュします。
// ========================================

import { Pool } from "pg"; // PostgreSQL クライアントライブラリからPoolをインポート

// globalThis を拡張して pool プロパティを追加する型定義
// これにより TypeScript でグローバル変数として pool にアクセスできる
const globalForPg = global as typeof globalThis & { pool?: Pool };

// 既存のプールがあれば再利用し、なければ新規作成
// ?? は Nullish Coalescing 演算子（左辺が null/undefined なら右辺を返す）
export const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL, // 環境変数から接続文字列を取得
  });

// 開発環境（NODE_ENV !== "production"）の場合のみグローバルにキャッシュ
// これにより HMR で新しいプールが作成されるのを防ぐ
// 本番環境ではサーバーレス関数のコールドスタート時に毎回新規作成される
if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool; // グローバル変数にプールを保存
}
