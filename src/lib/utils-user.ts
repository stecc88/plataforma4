import type { User } from './db'

/* ─── Remove sensitive fields from user object before sending to client ─── */

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

/* ─── Generate unique 6-char uppercase alphanumeric teacher code ─── */

export function generateTeacherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
