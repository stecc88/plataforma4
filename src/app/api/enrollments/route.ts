import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── GET /api/enrollments ───────────────────────────────────── */

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

    let enrollments

    if (auth.role === ROLES.ADMIN) {
      // ─── Admin sees all enrollments ────────────────────────
      enrollments = await db.enrollment.findMany({
        order: '-enrolledAt',
      })
    } else if (auth.role === ROLES.TEACHER) {
      // ─── Teacher sees their students ────────────────────────
      enrollments = await db.enrollment.findMany({
        where: { teacherId: auth.userId },
        order: '-enrolledAt',
      })
    } else {
      // ─── Student sees their enrollments ─────────────────────
      enrollments = await db.enrollment.findMany({
        where: { studentId: auth.userId },
        order: '-enrolledAt',
      })
    }

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('[enrollments] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle iscrizioni' },
      { status: 500 }
    )
  }
}
