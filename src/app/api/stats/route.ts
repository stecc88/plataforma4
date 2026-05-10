import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthFromRequest, ROLES } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/* ─── GET /api/stats — Statistics ─────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (auth.role === ROLES.ADMIN) {
      // ─── Admin: global stats ────────────────────────────────
      const totalStudents = await db.user.count({ where: { role: 'STUDENT' } })
      const totalTeachers = await db.user.count({ where: { role: 'TEACHER' } })
      const totalEssays = await db.essay.count()
      const correctedEssays = await db.essay.count({ where: { status: 'CORRECTED' } })
      const draftEssays = await db.essay.count({ where: { status: 'DRAFT' } })
      const submittedEssays = await db.essay.count({ where: { status: 'SUBMITTED' } })

      // Average AI score
      const { data: scoreData } = await supabase
        .from('essays')
        .select('ai_score')
        .not('ai_score', 'is', null)

      const scores = (scoreData || []).map((r: { ai_score: number }) => r.ai_score)
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0

      return NextResponse.json({
        stats: {
          totalStudents,
          totalTeachers,
          totalEssays,
          correctedEssays,
          draftEssays,
          submittedEssays,
          averageScore,
        },
      })
    }

    if (auth.role === ROLES.TEACHER) {
      // ─── Teacher: stats of their students ────────────────────
      const enrollments = await db.enrollment.findMany({
        where: { teacherId: auth.userId },
      })
      const studentIds = enrollments.map((e) => e.studentId)

      if (studentIds.length === 0) {
        return NextResponse.json({
          stats: {
            totalStudents: 0,
            totalEssays: 0,
            correctedEssays: 0,
            draftEssays: 0,
            submittedEssays: 0,
            averageScore: 0,
          },
        })
      }

      const { count: totalEssays } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)

      const { count: correctedEssays } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('status', 'CORRECTED')

      const { count: draftEssays } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('status', 'DRAFT')

      const { count: submittedEssays } = await supabase
        .from('essays')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .eq('status', 'SUBMITTED')

      const { data: scoreData } = await supabase
        .from('essays')
        .select('ai_score')
        .in('student_id', studentIds)
        .not('ai_score', 'is', null)

      const scores = (scoreData || []).map((r: { ai_score: number }) => r.ai_score)
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0

      return NextResponse.json({
        stats: {
          totalStudents: studentIds.length,
          totalEssays: totalEssays || 0,
          correctedEssays: correctedEssays || 0,
          draftEssays: draftEssays || 0,
          submittedEssays: submittedEssays || 0,
          averageScore,
        },
      })
    }

    // ─── Student: their own stats ──────────────────────────────
    const totalEssays = await db.essay.count({ where: { studentId: auth.userId } })
    const correctedEssays = await db.essay.count({
      where: { studentId: auth.userId, status: 'CORRECTED' },
    })
    const draftEssays = await db.essay.count({
      where: { studentId: auth.userId, status: 'DRAFT' },
    })
    const submittedEssays = await db.essay.count({
      where: { studentId: auth.userId, status: 'SUBMITTED' },
    })

    const { data: scoreData } = await supabase
      .from('essays')
      .select('ai_score')
      .eq('student_id', auth.userId)
      .not('ai_score', 'is', null)

    const scores = (scoreData || []).map((r: { ai_score: number }) => r.ai_score)
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0

    // Latest score
    const latestScore = scores.length > 0 ? scores[scores.length - 1] : null

    return NextResponse.json({
      stats: {
        totalEssays,
        correctedEssays,
        draftEssays,
        submittedEssays,
        averageScore,
        latestScore,
      },
    })
  } catch (error) {
    console.error('[stats] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle statistiche' },
      { status: 500 }
    )
  }
}
