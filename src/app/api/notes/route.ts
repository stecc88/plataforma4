import { NextRequest, NextResponse } from 'next/server'
import { db, type TeacherNote } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/* ─── GET /api/notes — List teacher notes ────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentIdFilter = searchParams.get('studentId')

    let notes: TeacherNote[] = []

    if (auth.role === ROLES.ADMIN) {
      const where: Record<string, unknown> = {}
      if (studentIdFilter) where.studentId = studentIdFilter
      notes = await db.teacherNote.findMany({ where, order: '-createdAt' })
    } else if (auth.role === ROLES.TEACHER) {
      const where: Record<string, unknown> = { teacherId: auth.userId }
      if (studentIdFilter) where.studentId = studentIdFilter
      notes = await db.teacherNote.findMany({ where, order: '-createdAt' })
    } else {
      // Student sees notes about them
      notes = await db.teacherNote.findMany({
        where: { studentId: auth.userId },
        order: '-createdAt',
      })
    }

    // Enrich with teacher and student names
    if (notes.length > 0) {
      const teacherIds = [...new Set(notes.map((n) => n.teacherId))]
      const studentIds = [...new Set(notes.map((n) => n.studentId))]
      const allIds = [...new Set([...teacherIds, ...studentIds])]

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', allIds)

      const userMap = new Map(
        (usersData || []).map((u: { id: string; name: string }) => [u.id, u.name])
      )

      const enriched = notes.map((note) => ({
        ...note,
        teacherName: userMap.get(note.teacherId) || 'Sconosciuto',
        studentName: userMap.get(note.studentId) || 'Sconosciuto',
      }))

      return NextResponse.json({ notes: enriched })
    }

    return NextResponse.json({ notes: [] })
  } catch (error) {
    console.error('[notes GET] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle note' },
      { status: 500 }
    )
  }
}

/* ─── POST /api/notes — Create teacher note ──────────────────── */

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only TEACHER and ADMIN can create notes
    if (auth.role !== ROLES.TEACHER && auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Solo gli insegnanti possono creare note' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, content } = body as {
      studentId?: string
      content?: string
    }

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json(
        { error: 'ID studente obbligatorio' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await db.user.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json(
        { error: 'Studente non trovato' },
        { status: 404 }
      )
    }

    // If teacher, verify the student is enrolled with them
    if (auth.role === ROLES.TEACHER) {
      const enrollment = await db.enrollment.findUnique({
        where: { studentId, teacherId: auth.userId },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Lo studente non è iscritto alle tue lezioni' },
          { status: 403 }
        )
      }
    }

    const note = await db.teacherNote.create({
      data: {
        teacherId: auth.userId,
        studentId,
        content: content.trim(),
      } as unknown as TeacherNote,
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    console.error('[notes POST] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la creazione della nota' },
      { status: 500 }
    )
  }
}
