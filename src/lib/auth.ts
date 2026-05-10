import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import type { UserRole, UserStatus } from './db'

/* ─── Constants ──────────────────────────────────────────────── */

const JWT_SECRET_ENV = process.env.JWT_SECRET

function getSecret() {
  const secret = JWT_SECRET_ENV
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  return new TextEncoder().encode(secret || 'fallback-secret-change-me')
}

/* ─── Roles & Status ─────────────────────────────────────────── */

export { type UserRole, type UserStatus } from './db'

export const ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const

export const STATUSES = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const

/* ─── Token Payload ──────────────────────────────────────────── */

export interface AuthPayload {
  userId: string
  email: string
  role: UserRole
  status: UserStatus
}

/* ─── Password Utilities ─────────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/* ─── JWT Utilities ──────────────────────────────────────────── */

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}

/* ─── Request Authentication ─────────────────────────────────── */

export async function getAuthFromRequest(
  request: NextRequest
): Promise<AuthPayload | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return null

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null

  const token = parts[1]
  return verifyToken(token)
}
