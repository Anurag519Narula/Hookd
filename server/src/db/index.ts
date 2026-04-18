import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,                // Supabase free tier has low connection limits
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function initDb(): Promise<void> {
  // Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      email           TEXT UNIQUE NOT NULL,
      password_hash   TEXT NOT NULL,
      name            TEXT NOT NULL,
      created_at      BIGINT NOT NULL
    )
  `);

  // Ideas table (original)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ideas (
      id              TEXT PRIMARY KEY,
      raw_text        TEXT NOT NULL,
      created_at      BIGINT NOT NULL,
      tags            JSONB,
      format_type     TEXT,
      emotion_angle   TEXT,
      potential_score TEXT,
      hooks           JSONB,
      captions        JSONB,
      status          TEXT NOT NULL DEFAULT 'raw',
      user_id         TEXT REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Migrate existing ideas table — add user_id, selected_hook, insights columns if missing
  await pool.query(`
    ALTER TABLE ideas 
    ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS selected_hook TEXT,
    ADD COLUMN IF NOT EXISTS insights JSONB,
    ADD COLUMN IF NOT EXISTS insights_cached_at BIGINT
  `);

  // Migrate existing users table — add creator profile columns if missing
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS niche               TEXT,
    ADD COLUMN IF NOT EXISTS sub_niche           TEXT,
    ADD COLUMN IF NOT EXISTS language            TEXT DEFAULT 'English',
    ADD COLUMN IF NOT EXISTS platform_priority   JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE
  `);

  // Amplify conversations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS amplify_conversations (
      id          TEXT PRIMARY KEY,
      user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      messages    JSONB NOT NULL DEFAULT '[]',
      created_at  BIGINT NOT NULL,
      updated_at  BIGINT NOT NULL
    )
  `);

  // Generic API response cache — stores expensive Groq/YouTube results
  // cache_key is a SHA-256 hash of the request params
  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_cache (
      cache_key   TEXT PRIMARY KEY,
      namespace   TEXT NOT NULL,
      payload     JSONB NOT NULL,
      created_at  BIGINT NOT NULL,
      expires_at  BIGINT NOT NULL
    )
  `);

  // Index for fast namespace-scoped lookups and TTL cleanup
  await pool.query(`
    CREATE INDEX IF NOT EXISTS api_cache_namespace_idx ON api_cache (namespace);
    CREATE INDEX IF NOT EXISTS api_cache_expires_idx ON api_cache (expires_at);
  `);

  // Per-user daily usage tracking for expensive external API calls
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usage_limits (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action      TEXT NOT NULL,
      date        TEXT NOT NULL,
      count       INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, action, date)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS usage_limits_user_date_idx ON usage_limits (user_id, date);
  `);
}

export default pool;
