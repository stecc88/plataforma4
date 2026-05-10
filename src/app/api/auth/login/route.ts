import { NextRequest, NextResponse } from 'next/server'
import { db, type User } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { verifyPassword, signToken, STATUSES } from '@/lib/auth'

/* ─── Sanitize user (remove password) ────────────────────────── */

function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user
  return safe
}

/* ─── POST /api/auth/login ───────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    // ─── Supabase configuration check ──────────────────────
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase non configurato. Aggiungi NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nel file .env.local' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password } = body as {
      email?: string
      password?: string
    }

    // ─── Input validation ───────────────────────────────────
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email obbligatoria' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password obbligatoria' },
        { status: 400 }
      )
    }

    // ─── Find user by email ─────────────────────────────────
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // ─── Verify password ────────────────────────────────────
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // ─── Check account status ───────────────────────────────
    if (user.status === STATUSES.PENDING) {
      return NextResponse.json(
        { error: 'Account in attesa di approvazione' },
        { status: 403 }
      )
    }

    if (user.status === STATUSES.SUSPENDED) {
      return NextResponse.json(
        { error: 'Account sospeso' },
        { status: 403 }
      )
    }

    // ─── Generate JWT ───────────────────────────────────────
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    return NextResponse.json({
      token,
      user: sanitizeUser(user),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    )
  }
}
