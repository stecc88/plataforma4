import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── GET /api/preparations — List class preparations ────────── */

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (auth.role === ROLES.ADMIN) {
      // Admin sees all preparations
      const preparations = await db.classPreparation.findMany({
        order: '-generatedAt',
      })
      return NextResponse.json({ preparations })
    }

    if (auth.role === ROLES.TEACHER) {
      // Teacher sees their own preparations
      const preparations = await db.classPreparation.findMany({
        where: { teacherId: auth.userId },
        order: '-generatedAt',
      })
      return NextResponse.json({ preparations })
    }

    // Students cannot access preparations
    return NextResponse.json(
      { error: 'Accesso negato' },
      { status: 403 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il recupero delle preparazioni' },
      { status: 500 }
    )
  }
}
