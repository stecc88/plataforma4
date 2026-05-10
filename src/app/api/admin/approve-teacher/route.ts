import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthFromRequest, ROLES, STATUSES } from '@/lib/auth'
import { generateTeacherCode } from '@/lib/utils-user'

/* ─── Snake_case → camelCase converter ──────────────────────────── */

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

/* ─── POST /api/admin/approve-teacher ─────────────────────────── */

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

    // ─── Only ADMIN can approve teachers ────────────────────
    if (auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono approvare docenti.' },
        { status: 403 }
      )
    }

    // ─── Parse request body ─────────────────────────────────
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId è obbligatorio' },
        { status: 400 }
      )
    }

    // ─── Verify user exists and is a pending teacher ────────
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 400 }
      )
    }

    if (user.role !== ROLES.TEACHER) {
      return NextResponse.json(
        { error: "L'utente non è un docente" },
        { status: 400 }
      )
    }

    if (user.status !== STATUSES.PENDING) {
      return NextResponse.json(
        { error: 'Il docente non è in stato di attesa' },
        { status: 400 }
      )
    }

    // ─── Generate unique teacher_code ───────────────────────
    let teacherCode = ''
    let codeExists = true
    let attempts = 0
    const maxAttempts = 50

    while (codeExists && attempts < maxAttempts) {
      teacherCode = generateTeacherCode()
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('teacher_code', teacherCode)
        .maybeSingle()
      codeExists = existing !== null
      attempts++
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Impossibile generare un codice docente unico. Riprova.' },
        { status: 500 }
      )
    }

    // ─── Update user: ACTIVE status + teacher_code ──────────
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        status: STATUSES.ACTIVE,
        teacher_code: teacherCode,
      })
      .eq('id', userId)
      .select('id, email, name, role, status, teacher_code, created_at')
      .single()

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: "Errore durante l'aggiornamento dell'utente" },
        { status: 500 }
      )
    }

    // ─── Return updated user (camelCase, no password_hash) ──
    return NextResponse.json({
      user: toCamelCase(updatedUser),
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante l'approvazione del docente" },
      { status: 500 }
    )
  }
}
