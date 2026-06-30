'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { query } from '@/lib/db'
import { getSession } from './auth'
import type { ActionResult } from '@/types'

export interface LeaderboardEntry {
  id: string
  username: string
  user_id: string | null
  score: number
  date: string
}

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(18, 'Username must be 18 characters or less.')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Use only letters, numbers, underscores, or hyphens.')

export async function getTopLeaderboard(): Promise<LeaderboardEntry[]> {
  return query<LeaderboardEntry>`
    SELECT id, username, user_id, score, date
    FROM leaderboard
    ORDER BY score DESC, date ASC
    LIMIT 100
  `
}

export async function getLeaderboardEntry(userId: string) {
  const rows = await query<LeaderboardEntry>`
    SELECT id, username, user_id, score, date
    FROM leaderboard
    WHERE user_id = ${userId}
    LIMIT 1
  `

  return rows[0] ?? null
}

export async function getCurrentLeaderboardEntry(): Promise<LeaderboardEntry | null> {
  const session = await getSession()

  if (!session) return null

  return getLeaderboardEntry(session.id)
}

export async function createLeaderboardProfile(
  _prevState: ActionResult<LeaderboardEntry> | null,
  formData: FormData
): Promise<ActionResult<LeaderboardEntry>> {
  const session = await getSession()

  if (!session) {
    return { error: 'You must sign in first.' }
  }

  const parsed = usernameSchema.safeParse(formData.get('username'))

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const username = parsed.data

  const existingUser = await getLeaderboardEntry(session.id)

  if (existingUser) {
    return { data: existingUser }
  }

  const existingUsername = await query<{ id: string }>`
    SELECT id
    FROM leaderboard
    WHERE LOWER(username) = LOWER(${username})
    LIMIT 1
  `

  if (existingUsername.length > 0) {
    return { error: 'This username has already been chosen.' }
  }

  const [entry] = await query<LeaderboardEntry>`
    INSERT INTO leaderboard (username, user_id, score)
    VALUES (${username}, ${session.id}, 0)
    RETURNING id, username, user_id, score, date
  `

  revalidatePath('/battle')
  revalidatePath('/leaderboard')

  return { data: entry }
}

export async function addBattleScore(points: number): Promise<ActionResult<LeaderboardEntry>> {
  const session = await getSession()

  if (!session) {
    return { error: 'You must sign in first.' }
  }

  const safePoints = Math.max(0, Math.min(10000, Math.floor(points)))

  if (safePoints <= 0) {
    const entry = await getLeaderboardEntry(session.id)
    return entry ? { data: entry } : { error: 'Create a leaderboard username first.' }
  }

  const [entry] = await query<LeaderboardEntry>`
    UPDATE leaderboard
    SET score = score + ${safePoints}, date = NOW()
    WHERE user_id = ${session.id}
    RETURNING id, username, user_id, score, date
  `

  if (!entry) {
    return { error: 'Create a leaderboard username first.' }
  }

  revalidatePath('/battle')
  revalidatePath('/leaderboard')

  return { data: entry }
}
