import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── Snake_case → camelCase converter ──────────────────────────── */

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

/* ─── GET /api/admin/users ─────────────────────────────────────── */

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

    // ─── Only ADMIN can list users ──────────────────────────
    if (auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Accesso negato. Solo gli amministratori possono visualizzare gli utenti.' },
        { status: 403 }
      )
    }

    // ─── Parse query filters ────────────────────────────────
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const statusFilter = searchParams.get('status')

    // ─── Build Supabase query (exclude password_hash) ───────
    let query = supabase
      .from('users')
      .select('id, email, name, role, status, teacher_code, created_at')

    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('[admin/users] Supabase error:', error)
      return NextResponse.json(
        { error: 'Errore durante il recupero degli utenti' },
        { status: 500 }
      )
    }

    // ─── Convert snake_case to camelCase ────────────────────
    const users = (data || []).map(toCamelCase)

    return NextResponse.json({ users })
  } catch (error) {
    console.error('[admin/users] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero degli utenti' },
      { status: 500 }
    )
  }
}
