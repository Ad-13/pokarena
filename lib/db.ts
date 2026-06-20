import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const sql = neon(process.env.DATABASE_URL)

export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]>
export async function query<T>(
  rawSql: string,
  params?: unknown[]
): Promise<T[]>
export async function query<T>(
  stringsOrRaw: TemplateStringsArray | string,
  ...rest: unknown[]
): Promise<T[]> {
  try {
    if (typeof stringsOrRaw === 'string') {
      const result = await sql.query(stringsOrRaw, (rest[0] as unknown[]) ?? [])
      return result as T[]
    }
    const result = await sql(stringsOrRaw, ...rest)
    return result as T[]
  } catch (error) {
    console.error('[DB Error]', error)
    throw error
  }
}
