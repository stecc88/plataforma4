import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── GET /api/enrollments ───────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    let enrollments

    if (auth.role === ROLES.ADMIN) {
      enrollments = await db.enrollment.findMany({
        order: '-enrolledAt',
      })
    } else if (auth.role === ROLES.TEACHER) {
      enrollments = await db.enrollment.findMany({
        where: { teacherId: auth.userId },
        order: '-enrolledAt',
      })
    } else {
      enrollments = await db.enrollment.findMany({
        where: { studentId: auth.userId },
        order: '-enrolledAt',
      })
    }

    return NextResponse.json({ enrollments })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il recupero delle iscrizioni' },
      { status: 500 }
    )
  }
}

/* ─── POST /api/enrollments — Enroll student with teacher code ── */

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)

    if (!auth) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      )
    }

    // Only STUDENT can enroll with a teacher code
    if (auth.role !== ROLES.STUDENT) {
      return NextResponse.json(
        { error: 'Solo gli studenti possono iscriversi con un codice docente' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { teacherCode } = body as { teacherCode?: string }

    if (!teacherCode || typeof teacherCode !== 'string' || teacherCode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Codice docente obbligatorio' },
        { status: 400 }
      )
    }

    // Find the teacher by code
    const teacher = await db.user.findUnique({
      where: { teacherCode: teacherCode.trim() },
    })

    if (!teacher || teacher.role !== ROLES.TEACHER) {
      return NextResponse.json(
        { error: 'Codice docente non valido' },
        { status: 404 }
      )
    }

    if (teacher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Il docente non è ancora attivo' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { studentId: auth.userId, teacherId: teacher.id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Sei già iscritto a questo docente' },
        { status: 409 }
      )
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        studentId: auth.userId,
        teacherId: teacher.id,
        teacherCode: teacherCode.trim(),
      } as unknown as import('@/lib/db').Enrollment,
    })

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante l\'iscrizione' },
      { status: 500 }
    )
  }
}
