import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── GET /api/essays/[id] — Get specific essay ──────────────── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { id } = await params
    const essay = await db.essay.findUnique({ where: { id } })

    if (!essay) {
      return NextResponse.json(
        { error: 'Tema non trovato' },
        { status: 404 }
      )
    }

    // Check permissions
    if (auth.role === ROLES.STUDENT && essay.studentId !== auth.userId) {
      return NextResponse.json(
        { error: 'Accesso negato' },
        { status: 403 }
      )
    }

    if (auth.role === ROLES.TEACHER) {
      const enrollment = await db.enrollment.findUnique({
        where: { studentId: essay.studentId, teacherId: auth.userId },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Accesso negato' },
          { status: 403 }
        )
      }
    }

    // Admin can see everything

    // Get student name
    const student = await db.user.findUnique({ where: { id: essay.studentId } })

    return NextResponse.json({
      essay: {
        ...essay,
        studentName: student?.name || 'Sconosciuto',
      },
    })
  } catch (error) {
    console.error('[essays/[id] GET] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero del tema' },
      { status: 500 }
    )
  }
}
