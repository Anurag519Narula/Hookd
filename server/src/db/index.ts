import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
}

export default pool;
