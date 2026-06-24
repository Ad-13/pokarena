import { query } from './db'

export async function initializeDatabase(): Promise<void> {
  await query`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT        NOT NULL UNIQUE,
      password_hash TEXT        NOT NULL,
      name          TEXT        NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await query`
    CREATE TABLE IF NOT EXISTS roster_items (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pokemon_id   INTEGER     NOT NULL,
      pokemon_name TEXT        NOT NULL,
      sprite_url   TEXT        NOT NULL DEFAULT '',
      added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, pokemon_id)
    )
  `

  await query`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT        NOT NULL UNIQUE,
      user_id  UUID        UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      score    INTEGER     NOT NULL DEFAULT 0 CHECK (score >= 0),
      date     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await query`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'leaderboard_score_non_negative'
      ) THEN
        ALTER TABLE leaderboard
        ADD CONSTRAINT leaderboard_score_non_negative CHECK (score >= 0);
      END IF;
    END
    $$
  `

  await query`
    CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_username_lower_unique
    ON leaderboard (LOWER(username))
  `

  await query`
    CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_user_id_unique
    ON leaderboard (user_id)
    WHERE user_id IS NOT NULL
  `

  console.log('[PokArena] Database initialised')
}
