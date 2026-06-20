export interface User {
  id:         string
  email:      string
  name:       string
  created_at: string
}

export type SessionUser = Omit<User, 'created_at'>
