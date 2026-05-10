import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'

/* ─── POST /api/essays/[id]/self-assess ──────────────────────── */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only STUDENT can self-assess
    if (auth.role !== ROLES.STUDENT) {
      return NextResponse.json(
        { error: 'Solo gli studenti possono autovalutarsi' },
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
        { error: 'Puoi autovalutarti solo sui tuoi temi' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { selfScore, selfNotes } = body as {
      selfScore?: number
      selfNotes?: string
    }

    if (typeof selfScore !== 'number' || selfScore < 0 || selfScore > 100) {
      return NextResponse.json(
        { error: 'Il punteggio deve essere un numero tra 0 e 100' },
        { status: 400 }
      )
    }

    if (!selfNotes || typeof selfNotes !== 'string' || selfNotes.trim().length < 1) {
      return NextResponse.json(
        { error: 'Le note di autovalutazione sono obbligatorie' },
        { status: 400 }
      )
    }

    // Merge self-assessment into existing ai_correction
    const existingCorrection = (essay.aiCorrection || {}) as Record<string, unknown>
    const updatedCorrection = {
      ...existingCorrection,
      selfAssessment: {
        selfScore,
        selfNotes: selfNotes.trim(),
        assessedAt: new Date().toISOString(),
      },
    }

    const updatedEssay = await db.essay.update({
      where: { id },
      data: {
        aiCorrection: updatedCorrection,
      },
    })

    return NextResponse.json({ essay: updatedEssay })
  } catch (error) {
    console.error('[essays/[id]/self-assess] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'autovalutazione' },
      { status: 500 }
    )
  }
}
