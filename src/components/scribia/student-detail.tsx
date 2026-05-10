'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type EssayItem } from '@/store/app-store'
import { apiFetch } from './api-fetch'
import { getSelectedStudent } from './teacher-state'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  PenLine,
  Star,
  AlertTriangle,
  BookOpen,
  StickyNote,
  Loader2,
  Mail,
  Calendar,
  KeyRound,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  BarChart3,
} from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────── */

interface CorrectionError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'syntax' | 'vocabulary' | 'style'
  original: string
  correction: string
  explanation: string
  position: number
}

interface AICorrection {
  correctedText: string
  score: number
  errors: CorrectionError[]
  grammarNotes: string[]
  vocabularyNotes: string[]
  styleNotes: string[]
  suggestions: {
    connectors: string[]
    synonyms: Array<{ word: string; alternatives: string[] }>
  }
  studyTopics: string[]
}

/* ─── Error type labels ──────────────────────────────────────── */

const ERROR_LABELS: Record<string, string> = {
  grammar: 'Grammatica',
  spelling: 'Ortografia',
  punctuation: 'Punteggiatura',
  syntax: 'Sintassi',
  vocabulary: 'Vocabolario',
  style: 'Stile',
}

const ERROR_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  grammar: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  spelling: { bar: 'bg-red-400', text: 'text-red-500 dark:text-red-300', bg: 'bg-red-400/10' },
  punctuation: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  syntax: { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  vocabulary: { bar: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
  style: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
}

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
} as const

/* ─── Status Badge ───────────────────────────────────────────── */

function EssayStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'CORRECTED':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1">
          <CheckCircle2 className="size-3" /> Corretto
        </Badge>
      )
    case 'SUBMITTED':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 gap-1">
          <Clock className="size-3" /> Inviato
        </Badge>
      )
    case 'DRAFT':
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <PenLine className="size-3" /> Bozza
        </Badge>
      )
  }
}

/* ─── Add Note Dialog ────────────────────────────────────────── */

function AddNoteDialog({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [open, setOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fetchNotes } = useAppStore()

  const handleSubmit = async () => {
    if (!noteContent.trim()) {
      toast.error('Scrivi qualcosa nella nota.')
      return
    }
    setIsSubmitting(true)
    try {
      await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ studentId, content: noteContent.trim() }),
      })
      toast.success('Nota aggiunta con successo!')
      setNoteContent('')
      setOpen(false)
      fetchNotes()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio della nota')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
        >
          <StickyNote className="size-4" /> Aggiungi Nota
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi Nota per {studentName}</DialogTitle>
          <DialogDescription>
            Scrivi un&apos;osservazione o un appunto su questo studente. Le note sono visibili solo agli insegnanti.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Scrivi la tua nota qui..."
            rows={5}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !noteContent.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
          >
            {isSubmitting && <Loader2 className="size-4 mr-1 animate-spin" />}
            Salva Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Student Detail ─────────────────────────────────────────── */

export function StudentDetail() {
  const { setCurrentView, setCurrentEssay } = useAppStore()
  const selected = getSelectedStudent()

  const [studentEssays, setStudentEssays] = useState<EssayItem[]>([])
  const [isLoadingEssays, setIsLoadingEssays] = useState(false)

  // Fetch essays for the selected student
  const fetchStudentEssays = useCallback(async () => {
    if (!selected.id) return
    setIsLoadingEssays(true)
    try {
      const data = await apiFetch<{ essays: EssayItem[] }>(
        `/api/essays?studentId=${selected.id}`
      )
      setStudentEssays(data.essays || [])
    } catch (err) {
      console.error('[student-detail] Failed to fetch essays:', err)
      toast.error('Errore nel caricamento dei saggi')
    } finally {
      setIsLoadingEssays(false)
    }
  }, [selected.id])

  useEffect(() => {
    fetchStudentEssays()
  }, [fetchStudentEssays])

  // ─── Weakness Profile: Aggregate errors from corrected essays ───
  const weaknessProfile = useMemo(() => {
    const correctedEssays = studentEssays.filter(
      (e) => e.status === 'CORRECTED' && e.aiCorrection
    )

    if (correctedEssays.length === 0) {
      return { errorTypes: [], studyTopics: [], scores: [] }
    }

    // Aggregate errors by type
    const errorCounts: Record<string, number> = {}
    const allStudyTopics: string[] = []
    const scores: number[] = []

    for (const essay of correctedEssays) {
      const correction = essay.aiCorrection as AICorrection | null
      if (!correction) continue

      // Count errors by type
      if (correction.errors && Array.isArray(correction.errors)) {
        for (const error of correction.errors) {
          const t = error.type || 'other'
          errorCounts[t] = (errorCounts[t] || 0) + 1
        }
      }

      // Collect study topics
      if (correction.studyTopics && Array.isArray(correction.studyTopics)) {
        allStudyTopics.push(...correction.studyTopics)
      }

      // Collect scores
      if (essay.aiScore !== null) {
        scores.push(essay.aiScore)
      }
    }

    // Sort error types by frequency (most frequent first)
    const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0)
    const errorTypes = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0,
      }))

    // Deduplicate study topics
    const uniqueTopics = [...new Set(allStudyTopics)]

    return { errorTypes, studyTopics: uniqueTopics, scores }
  }, [studentEssays])

  // ─── Score trend ───
  const scoreTrend = useMemo(() => {
    const { scores } = weaknessProfile
    if (scores.length < 2) return null
    const recent = scores[scores.length - 1]
    const previous = scores[scores.length - 2]
    if (recent > previous) return 'up'
    if (recent < previous) return 'down'
    return 'stable'
  }, [weaknessProfile])

  // ─── No student selected ───
  if (!selected.id) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Dettaglio Studente</h2>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <GraduationCap className="size-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">Seleziona uno studente dalla dashboard</p>
            <p className="text-sm mb-4">
              Clicca su uno studente nella dashboard per vedere i dettagli.
            </p>
            <Button
              onClick={() => setCurrentView('dashboard')}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              <ArrowLeft className="size-4 mr-1.5" /> Torna alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const correctedCount = studentEssays.filter((e) => e.status === 'CORRECTED').length
  const avgScore =
    weaknessProfile.scores.length > 0
      ? Math.round(
          weaknessProfile.scores.reduce((a, b) => a + b, 0) /
            weaknessProfile.scores.length
        )
      : null

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="size-4 mr-1" /> Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-lg font-bold shadow-md">
              {selected.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {selected.name || 'Studente'}
              </h2>
              <p className="text-sm text-muted-foreground">Dettaglio studente</p>
            </div>
          </div>
        </div>
        <AddNoteDialog studentId={selected.id} studentName={selected.name || 'Studente'} />
      </motion.div>

      {/* ─── Student Info Card ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="text-sm font-medium">{selected.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-teal-500/10">
                  <Mail className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{selected.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Calendar className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Iscritto il</p>
                  <p className="text-sm font-medium">
                    {selected.enrolledAt
                      ? new Date(selected.enrolledAt).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10">
                  <KeyRound className="size-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Codice Docente</p>
                  <p className="text-sm font-medium font-mono">
                    {useAppStore.getState().user?.teacherCode || '—'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Quick Stats ─── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="overflow-hidden">
            <div className="h-1 bg-emerald-500" />
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{studentEssays.length}</p>
              <p className="text-xs text-muted-foreground">Saggi Totali</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="h-1 bg-teal-500" />
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{correctedCount}</p>
              <p className="text-xs text-muted-foreground">Corretti</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="h-1 bg-amber-500" />
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{avgScore ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Punteggio Medio</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <div className="h-1 bg-orange-500" />
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold">
                  {weaknessProfile.scores.length > 0
                    ? weaknessProfile.scores[weaknessProfile.scores.length - 1]
                    : '—'}
                </p>
                {scoreTrend === 'up' && <TrendingUp className="size-4 text-emerald-500" />}
                {scoreTrend === 'down' && <TrendingDown className="size-4 text-red-500" />}
                {scoreTrend === 'stable' && <Minus className="size-4 text-amber-500" />}
              </div>
              <p className="text-xs text-muted-foreground">Ultimo Punteggio</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ─── Essay List ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Saggi dello Studente
                </CardTitle>
                <CardDescription className="mt-1">
                  {studentEssays.length === 0
                    ? 'Nessun saggio ancora'
                    : `${studentEssays.length} saggi · ${correctedCount} corretti`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingEssays ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-emerald-500" />
              </div>
            ) : studentEssays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-20" />
                <p>Nessun saggio ancora.</p>
                <p className="text-xs mt-1">Lo studente non ha ancora scritto nessun saggio.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                {studentEssays
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )
                  .map((essay) => (
                    <motion.button
                      key={essay.id}
                      variants={itemVariants}
                      onClick={() => {
                        setCurrentEssay(essay)
                        setCurrentView('essay-detail')
                      }}
                      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-accent/50 transition-all text-left group"
                      whileHover={{ x: 2 }}
                    >
                      {/* Status icon */}
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${
                          essay.status === 'CORRECTED'
                            ? 'bg-emerald-500/10'
                            : essay.status === 'SUBMITTED'
                            ? 'bg-amber-500/10'
                            : 'bg-muted'
                        }`}
                      >
                        {essay.status === 'CORRECTED' ? (
                          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : essay.status === 'SUBMITTED' ? (
                          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <PenLine className="size-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Essay info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {essay.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(essay.createdAt).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {/* Score + Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        {essay.aiScore !== null && (
                          <Badge
                            className={`text-xs gap-1 ${
                              essay.aiScore >= 70
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : essay.aiScore >= 40
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                : 'bg-red-500/10 text-red-700 dark:text-red-400'
                            }`}
                          >
                            <Star className="size-3" /> {essay.aiScore}
                          </Badge>
                        )}
                        <EssayStatusBadge status={essay.status} />
                      </div>
                    </motion.button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Weakness Profile Card ─── */}
      {correctedCount > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="size-5 text-amber-600 dark:text-amber-400" />
                Profilo Debolezze
              </CardTitle>
              <CardDescription>
                Analisi aggregata degli errori da {correctedCount} saggi corretti.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error type distribution */}
              {weaknessProfile.errorTypes.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Tipi di Errore Più Frequenti
                  </h4>
                  <div className="space-y-3">
                    {weaknessProfile.errorTypes.map(({ type, count, percentage }) => {
                      const config = ERROR_COLORS[type] || {
                        bar: 'bg-muted',
                        text: 'text-muted-foreground',
                        bg: 'bg-muted',
                      }
                      return (
                        <div key={type} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs ${config.bg} ${config.text} border-0`}
                              >
                                {ERROR_LABELS[type] || type}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {count} {count === 1 ? 'errore' : 'errori'} ({percentage}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="h-2 flex-1" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nessun errore rilevato nei saggi corretti!</p>
                </div>
              )}

              <Separator />

              {/* Study topics */}
              {weaknessProfile.studyTopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Brain className="size-4 text-teal-500" />
                    Argomenti di Studio Consigliati
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {weaknessProfile.studyTopics.map((topic, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800"
                      >
                        <BookOpen className="size-3 mr-1" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Average score trend */}
              {weaknessProfile.scores.length >= 2 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="size-4 text-emerald-500" />
                      Andamento Punteggi
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex items-end gap-1 h-16">
                        {weaknessProfile.scores.map((score, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${score}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`w-6 rounded-t-sm min-h-[4px] ${
                              score >= 70
                                ? 'bg-emerald-500'
                                : score >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            title={`Punteggio: ${score}`}
                          />
                        ))}
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          {scoreTrend === 'up' && (
                            <TrendingUp className="size-4 text-emerald-500" />
                          )}
                          {scoreTrend === 'down' && (
                            <TrendingDown className="size-4 text-red-500" />
                          )}
                          {scoreTrend === 'stable' && (
                            <Minus className="size-4 text-amber-500" />
                          )}
                          <span className="text-muted-foreground">
                            {scoreTrend === 'up'
                              ? 'In miglioramento'
                              : scoreTrend === 'down'
                              ? 'In calo'
                              : 'Stabile'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Media: {avgScore} · Ultimo:{' '}
                          {weaknessProfile.scores[weaknessProfile.scores.length - 1]}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
