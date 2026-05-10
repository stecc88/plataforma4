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
    return NextResponse.json(
      { error: 'Errore durante il recupero del tema' },
      { status: 500 }
    )
  }
}

/* ─── PUT /api/essays/[id] — Update essay ────────────────────── */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only STUDENT can update their own essays
    if (auth.role !== ROLES.STUDENT) {
      return NextResponse.json(
        { error: 'Solo gli studenti possono modificare i propri temi' },
        { status: 403 }
      )
    }

    const { id } = await params
    const essay = await db.essay.findUnique({ where: { id } })

    if (!essay) {
      return NextResponse.json(
        { error: 'Tema non trovato' },
        { status: 404 }
      )
    }

    if (essay.studentId !== auth.userId) {
      return NextResponse.json(
        { error: 'Puoi modificare solo i tuoi temi' },
        { status: 403 }
      )
    }

    // Only DRAFT essays can be updated
    if (essay.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo le bozze possono essere modificate' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, content } = body as { title?: string; content?: string }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined && typeof title === 'string' && title.trim().length >= 1) {
      updateData.title = title.trim()
    }
    if (content !== undefined && typeof content === 'string' && content.trim().length >= 10) {
      updateData.content = content.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nessun campo valido da aggiornare' },
        { status: 400 }
      )
    }

    const updatedEssay = await db.essay.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ essay: updatedEssay })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento del tema' },
      { status: 500 }
    )
  }
}

/* ─── DELETE /api/essays/[id] — Delete essay ─────────────────── */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only STUDENT can delete their own essays, or ADMIN can delete any
    if (auth.role !== ROLES.STUDENT && auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Non autorizzato a eliminare temi' },
        { status: 403 }
      )
    }

    const { id } = await params
    const essay = await db.essay.findUnique({ where: { id } })

    if (!essay) {
      return NextResponse.json(
        { error: 'Tema non trovato' },
        { status: 404 }
      )
    }

    // Students can only delete their own DRAFT essays
    if (auth.role === ROLES.STUDENT) {
      if (essay.studentId !== auth.userId) {
        return NextResponse.json(
          { error: 'Puoi eliminare solo i tuoi temi' },
          { status: 403 }
        )
      }
      if (essay.status !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Solo le bozze possono essere eliminate' },
          { status: 400 }
        )
      }
    }

    await db.essay.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione del tema' },
      { status: 500 }
    )
  }
}
