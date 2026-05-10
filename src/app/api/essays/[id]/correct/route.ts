import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { correctEssay, type ItalianLevel } from '@/lib/ai'

/* ─── POST /api/essays/[id]/correct — AI Correction ──────────── */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only STUDENT can correct their own essays
    if (auth.role !== ROLES.STUDENT) {
      return NextResponse.json(
        { error: 'Solo gli studenti possono correggere i propri temi' },
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
        { error: 'Puoi correggere solo i tuoi temi' },
        { status: 403 }
      )
    }

    if (!essay.content || essay.content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Il tema deve avere almeno 10 caratteri per essere corretto' },
        { status: 400 }
      )
    }

    // Parse optional level from request body
    let level: ItalianLevel = 'B1'
    try {
      const body = await request.json()
      if (body?.level && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(body.level)) {
        level = body.level as ItalianLevel
      }
    } catch {
      // No body or invalid JSON, use default level
    }

    // ─── Call AI correction ─────────────────────────────────
    let correction
    try {
      correction = await correctEssay(essay.content, level)
    } catch (aiError) {
      console.error('[essays/[id]/correct] AI correction failed:', aiError)
      return NextResponse.json(
        { error: 'Error en la corrección AI. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // Verify we got a valid correction
    if (!correction || typeof correction.score !== 'number') {
      console.error('[essays/[id]/correct] Invalid AI response structure')
      return NextResponse.json(
        { error: 'Error en la corrección AI. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // ─── Save correction to database ────────────────────────
    const now = new Date().toISOString()
    const updatedEssay = await db.essay.update({
      where: { id },
      data: {
        status: 'CORRECTED',
        aiScore: correction.score,
        aiCorrection: correction as unknown as Record<string, unknown>,
        correctedAt: now,
        submittedAt: essay.submittedAt || now,
      },
    })

    return NextResponse.json({
      essay: updatedEssay,
      correction,
    })
  } catch (error) {
    console.error('[essays/[id]/correct] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error en la corrección AI. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
