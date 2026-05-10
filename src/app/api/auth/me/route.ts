import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest } from '@/lib/auth'
import { sanitizeUser } from '@/lib/utils-user'

/* ─── GET /api/auth/me ───────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    // ─── Verify JWT ─────────────────────────────────────────
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // ─── Fetch current user ─────────────────────────────────
    const user = await db.user.findUnique({
      where: { id: auth.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: sanitizeUser(user),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il recupero del profilo' },
      { status: 500 }
    )
  }
}
