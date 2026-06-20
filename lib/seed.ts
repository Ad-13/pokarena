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
      username TEXT        NOT NULL,
      user_id  UUID        REFERENCES users(id) ON DELETE SET NULL,
      score    INTEGER     NOT NULL,
      date     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  console.log('[PokArena] Database initialised')
}
