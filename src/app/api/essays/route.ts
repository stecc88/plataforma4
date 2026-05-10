import { NextRequest, NextResponse } from 'next/server'
import { db, type Essay } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/* ─── GET /api/essays — List essays ──────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentIdFilter = searchParams.get('studentId')
    const statusFilter = searchParams.get('status')

    let essays: Essay[] = []

    if (auth.role === ROLES.ADMIN) {
      // Admin sees all essays
      const where: Record<string, unknown> = {}
      if (studentIdFilter) where.studentId = studentIdFilter
      if (statusFilter) where.status = statusFilter
      essays = await db.essay.findMany({ where, order: '-createdAt' })
    } else if (auth.role === ROLES.TEACHER) {
      // Teacher sees essays from their students
      const enrollments = await db.enrollment.findMany({
        where: { teacherId: auth.userId },
      })
      const studentIds = enrollments.map((e) => e.studentId)

      if (studentIds.length === 0) {
        return NextResponse.json({ essays: [] })
      }

      // Use supabase directly for IN clause
      let query = supabase
        .from('essays')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)
      if (studentIdFilter) query = query.eq('student_id', studentIdFilter)

      const { data, error } = await query
      if (error) throw error
      essays = (data || []).map((row) => ({
        id: row.id,
        studentId: row.student_id,
        title: row.title,
        content: row.content,
        status: row.status,
        aiScore: row.ai_score,
        aiCorrection: row.ai_correction,
        teacherNotes: row.teacher_notes,
        submittedAt: row.submitted_at,
        correctedAt: row.corrected_at,
        createdAt: row.created_at,
      }))
    } else {
      // Student sees only their essays
      const where: Record<string, unknown> = { studentId: auth.userId }
      if (statusFilter) where.status = statusFilter
      essays = await db.essay.findMany({ where, order: '-createdAt' })
    }

    // Enrich with student names
    if (essays.length > 0) {
      const uniqueStudentIds = [...new Set(essays.map((e) => e.studentId))]

      // Use supabase for batch user fetch
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', uniqueStudentIds)

      const userMap = new Map(
        (usersData || []).map((u: { id: string; name: string }) => [u.id, u.name])
      )

      const enriched = essays.map((essay) => ({
        ...essay,
        studentName: userMap.get(essay.studentId) || 'Sconosciuto',
      }))

      return NextResponse.json({ essays: enriched })
    }

    return NextResponse.json({ essays: essays.map((e) => ({ ...e, studentName: '' })) })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante il recupero dei temi' },
      { status: 500 }
    )
  }
}

/* ─── POST /api/essays — Create essay ────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only STUDENT can create essays
    if (auth.role !== ROLES.STUDENT) {
      return NextResponse.json(
        { error: 'Solo gli studenti possono creare temi' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content } = body as { title?: string; content?: string }

    if (!title || typeof title !== 'string' || title.trim().length < 1) {
      return NextResponse.json(
        { error: 'Il titolo è obbligatorio' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Il contenuto deve avere almeno 10 caratteri' },
        { status: 400 }
      )
    }

    const essay = await db.essay.create({
      data: {
        studentId: auth.userId,
        title: title.trim(),
        content: content.trim(),
        status: 'DRAFT',
        aiScore: null,
        aiCorrection: null,
        teacherNotes: null,
        submittedAt: null,
        correctedAt: null,
      } as unknown as Essay,
    })

    return NextResponse.json({ essay }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la creazione del tema' },
      { status: 500 }
    )
  }
}
