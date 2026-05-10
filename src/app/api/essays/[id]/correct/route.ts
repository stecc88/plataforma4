import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { correctWriting, AITimeoutError, AIResponseError } from '@/lib/ai'
import type { ItalianLevel, CertificationType, TextType } from '@/lib/ai-correction.types'

/* ─── POST /api/essays/[id]/correct — AI Correction ──────────── */

const VALID_LEVELS: ItalianLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const VALID_CERTIFICATIONS: CertificationType[] = ['PLIDA', 'CILS']
const VALID_TEXT_TYPES: TextType[] = ['email', 'tema', 'lettera_formale', 'racconto', 'saggio', 'riassunto', 'altro']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Correct] Starting correction request')

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
    console.log('[Correct] Essay ID:', id, 'User:', auth.userId)

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

    // Parse correction parameters from request body
    let level: ItalianLevel = 'B1'
    let certification: CertificationType = 'CILS'
    let textType: TextType = 'tema'
    try {
      const body = await request.json()
      if (body?.level && VALID_LEVELS.includes(body.level)) {
        level = body.level as ItalianLevel
      }
      if (body?.certification && VALID_CERTIFICATIONS.includes(body.certification)) {
        certification = body.certification as CertificationType
      }
      if (body?.textType && VALID_TEXT_TYPES.includes(body.textType)) {
        textType = body.textType as TextType
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    console.log('[Correct] Params:', { level, certification, textType, textLength: essay.content.length })

    // ─── Call AI correction ─────────────────────────────────
    const correction = await correctWriting({
      text: essay.content,
      level,
      certification,
      textType,
    })

    // Verify we got a valid correction (safety net)
    if (!correction || typeof correction.score !== 'number') {
      console.error('[Correct] Invalid correction result:', correction)
      return NextResponse.json(
        { error: 'Errore nella correzione AI. Riprova.' },
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

    console.log('[Correct] Successfully corrected essay', id, 'Score:', correction.score)

    return NextResponse.json({
      essay: updatedEssay,
      correction,
    })
  } catch (error) {
    console.error('[Correct] Error:', error instanceof Error ? error.message : error)
    console.error('[Correct] Stack:', error instanceof Error ? error.stack : 'N/A')

    // Provide specific error messages
    if (error instanceof AITimeoutError) {
      return NextResponse.json(
        { error: 'La correzione AI ha impiegato troppo tempo. Riprova.' },
        { status: 504 }
      )
    }

    if (error instanceof AIResponseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 502 }
      )
    }

    // Return detailed error for debugging
    const errorMsg = error instanceof Error ? error.message : 'Errore sconosciuto'
    const errorStack = error instanceof Error ? error.stack : ''

    return NextResponse.json(
      {
        error: `Errore nella correzione AI: ${errorMsg}`,
        stack: errorStack || undefined,
      },
      { status: 500 }
    )
  }
}
