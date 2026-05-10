import { NextRequest, NextResponse } from 'next/server'
import { db, type ClassPreparation } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { generateLessonPreparation, type ItalianLevel, AITimeoutError } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

/* ─── POST /api/preparations/generate — AI lesson generation ─── */

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Only TEACHER and ADMIN can generate preparations
    if (auth.role !== ROLES.TEACHER && auth.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Solo gli insegnanti possono generare preparazioni' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, weaknesses, level, title } = body as {
      studentId?: string
      weaknesses?: string[]
      level?: string
      title?: string
    }

    if (!weaknesses || !Array.isArray(weaknesses) || weaknesses.length === 0) {
      return NextResponse.json(
        { error: 'Indica almeno una debolezza su cui lavorare' },
        { status: 400 }
      )
    }

    const validLevels: ItalianLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const preparationLevel: ItalianLevel =
      level && validLevels.includes(level as ItalianLevel)
        ? (level as ItalianLevel)
        : 'B1'

    // If teacher with studentId, auto-detect weaknesses from recent essays
    let resolvedWeaknesses = weaknesses

    if (auth.role === ROLES.TEACHER && studentId) {
      // Verify student is enrolled
      const enrollment = await db.enrollment.findUnique({
        where: { studentId, teacherId: auth.userId },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Lo studente non è iscritto alle tue lezioni' },
          { status: 403 }
        )
      }

      // If no explicit weaknesses, derive from student's corrected essays
      if (weaknesses.length === 0) {
        const { data: essayData } = await supabase
          .from('essays')
          .select('ai_correction')
          .eq('student_id', studentId)
          .eq('status', 'CORRECTED')
          .not('ai_correction', 'is', null)
          .order('corrected_at', { ascending: false })
          .limit(5)

        const studyTopics: string[] = []
        for (const essay of essayData || []) {
          const correction = essay.ai_correction as Record<string, unknown> | null
          if (correction?.studyTopics && Array.isArray(correction.studyTopics)) {
            studyTopics.push(...(correction.studyTopics as string[]))
          }
        }

        if (studyTopics.length > 0) {
          resolvedWeaknesses = [...new Set(studyTopics)].slice(0, 5)
        }
      }
    }

    // ─── Generate lesson with AI ────────────────────────────
    const preparation = await generateLessonPreparation(resolvedWeaknesses, preparationLevel)

    // ─── Save to database ───────────────────────────────────
    const savedPreparation = await db.classPreparation.create({
      data: {
        teacherId: auth.userId,
        title: title || preparation.title,
        content: preparation as unknown as Record<string, unknown>,
      } as unknown as ClassPreparation,
    })

    return NextResponse.json(
      {
        preparation: savedPreparation,
        lesson: preparation,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[preparations/generate] Error:', error)

    // Provide specific error message for timeout
    if (error instanceof AITimeoutError) {
      return NextResponse.json(
        { error: 'La generazione AI ha impiegato troppo tempo. Riprova.' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Errore nella generazione della preparazione' },
      { status: 500 }
    )
  }
}
