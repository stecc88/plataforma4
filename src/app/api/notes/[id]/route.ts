import { NextRequest, NextResponse } from 'next/server'
import { db, type TeacherNote } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── PUT /api/notes/[id] — Update teacher note ──────────────── */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only TEACHER and ADMIN can update notes
    if (auth.role !== ROLES.TEACHER && auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Solo gli insegnanti possono modificare note' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { content } = body as { content?: string }

    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return NextResponse.json(
        { error: 'Il contenuto della nota è obbligatorio' },
        { status: 400 }
      )
    }

    // Verify note exists
    const existing = await db.teacherNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      )
    }

    // Teachers can only edit their own notes
    if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
      return NextResponse.json(
        { error: 'Puoi modificare solo le tue note' },
        { status: 403 }
      )
    }

    const updated = await db.teacherNote.update({
      where: { id },
      data: { content: content.trim() } as unknown as Partial<TeacherNote>,
    })

    return NextResponse.json({ note: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la modifica della nota' },
      { status: 500 }
    )
  }
}

/* ─── DELETE /api/notes/[id] — Delete teacher note ────────────── */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only TEACHER and ADMIN can delete notes
    if (auth.role !== ROLES.TEACHER && auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Solo gli insegnanti possono eliminare note' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify note exists
    const existing = await db.teacherNote.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Nota non trovata' },
        { status: 404 }
      )
    }

    // Teachers can only delete their own notes
    if (auth.role === ROLES.TEACHER && existing.teacherId !== auth.userId) {
      return NextResponse.json(
        { error: 'Puoi eliminare solo le tue note' },
        { status: 403 }
      )
    }

    await db.teacherNote.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Errore durante l'eliminazione della nota" },
      { status: 500 }
    )
  }
}
