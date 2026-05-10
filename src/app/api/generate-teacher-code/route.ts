import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { generateTeacherCode } from '@/lib/utils-user'

/* ─── POST /api/generate-teacher-code ────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    // ─── Verify JWT ─────────────────────────────────────────
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // ─── Only ADMIN can generate teacher codes ──────────────
    if (auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono generare codici.' },
        { status: 403 }
      )
    }

    // ─── Generate unique code ───────────────────────────────
    let code: string = ''
    let codeExists = true
    let attempts = 0
    const maxAttempts = 50

    while (codeExists && attempts < maxAttempts) {
      code = generateTeacherCode()
      const existing = await db.user.findUnique({
        where: { teacherCode: code },
      })
      codeExists = existing !== null
      attempts++
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Impossibile generare un codice unico. Riprova.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      teacherCode: code,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la generazione del codice' },
      { status: 500 }
    )
  }
}
