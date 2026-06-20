'use server'

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signToken, verifyToken, COOKIE_NAME } from '@/lib/auth'
import { query } from '@/lib/db'
import type { ActionResult, SessionUser } from '@/types'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function register(
  _prevState: ActionResult<SessionUser> | null,
  formData: FormData
): Promise<ActionResult<SessionUser>> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { name, email, password } = parsed.data

    const existing = await query<{ id: string }>`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `
    if (existing.length > 0) {
      return { error: 'This email is already registered.' }
    }

    const password_hash = await bcrypt.hash(password, 12)

    const [user] = await query<SessionUser>`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${password_hash})
      RETURNING id, name, email
    `

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { data: user }
  } catch (error) {
    console.error('[register]', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function login(
  _prevState: ActionResult<SessionUser> | null,
  formData: FormData
): Promise<ActionResult<SessionUser>> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { email, password } = parsed.data

    const rows = await query<SessionUser & { password_hash: string }>`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (rows.length === 0) {
      return { error: 'Invalid email or password.' }
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return { error: 'Invalid email or password.' }
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return { data: { id: user.id, email: user.email, name: user.name } }
  } catch (error) {
    console.error('[login]', error)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const payload = await verifyToken(token)
    if (!payload) return null
    return { id: payload.userId, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}
