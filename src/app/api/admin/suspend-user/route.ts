import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthFromRequest, ROLES, STATUSES } from '@/lib/auth'

/* ─── Snake_case → camelCase converter ──────────────────────────── */

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

/* ─── POST /api/admin/suspend-user ─────────────────────────────── */

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

    // ─── Only ADMIN can suspend/activate users ──────────────
    if (auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono sospendere o attivare utenti.' },
        { status: 403 }
      )
    }

    // ─── Parse request body ─────────────────────────────────
    const body = await request.json()
    const { userId, action } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId è obbligatorio' },
        { status: 400 }
      )
    }

    if (!action || (action !== 'suspend' && action !== 'activate')) {
      return NextResponse.json(
        { error: "azione non valida. Usare 'suspend' o 'activate'" },
        { status: 400 }
      )
    }

    // ─── Cannot suspend yourself ────────────────────────────
    if (userId === auth.userId) {
      return NextResponse.json(
        { error: 'Non puoi sospendere o attivare il tuo stesso account' },
        { status: 400 }
      )
    }

    // ─── Verify user exists ─────────────────────────────────
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

    // ─── Cannot suspend admin users ─────────────────────────
    if (user.role === ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Non è possibile sospendere un amministratore' },
        { status: 400 }
      )
    }

    // ─── Determine new status ───────────────────────────────
    const newStatus = action === 'suspend' ? STATUSES.SUSPENDED : STATUSES.ACTIVE

    // ─── Update user status ─────────────────────────────────
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select('id, email, name, role, status, teacher_code, created_at')
      .single()

    if (updateError || !updatedUser) {
      console.error('[admin/suspend-user] Update error:', updateError)
      return NextResponse.json(
        { error: "Errore durante l'aggiornamento dello stato dell'utente" },
        { status: 500 }
      )
    }

    // ─── Return updated user (camelCase, no password_hash) ──
    return NextResponse.json({
      user: toCamelCase(updatedUser),
    })
  } catch (error) {
    console.error('[admin/suspend-user] Error:', error)
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dello stato dell'utente" },
      { status: 500 }
    )
  }
}
