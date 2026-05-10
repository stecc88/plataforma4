'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type PreparationItem } from '@/store/app-store'
import { apiFetch } from './api-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  BookOpen,
  Brain,
  Loader2,
  Sparkles,
  Target,
  Dumbbell,
  Home,
  StickyNote,
  Clock,
  ChevronDown,
  GraduationCap,
  ListChecks,
  FileText,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
} as const

/* ─── AI Correction Types (for weakness extraction) ──────────── */

interface CorrectionError {
  type: string
  original: string
  correction: string
  explanation: string
  position?: number
}

interface CorrectionSuggestions {
  connectors?: string[]
  synonyms?: Array<{ word: string; alternatives: string[] }>
}

interface AICorrection {
  errors?: CorrectionError[]
  studyTopics?: string[]
  grammarNotes?: string[]
  suggestions?: CorrectionSuggestions
}

/* ─── Preparation Content Types ──────────────────────────────── */

interface Activity {
  name?: string
  description?: string
  duration?: string
}

interface Exercise {
  type?: string
  instruction?: string
}

/* ─── Generate Response ──────────────────────────────────────── */

interface GenerateResponse {
  preparation: PreparationItem
  lesson: Record<string, unknown>
}

/* ─── Loading Overlay ────────────────────────────────────────── */

function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 shadow-xl"
        >
          <Brain className="size-10 text-white" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-lg font-semibold text-foreground"
        >
          Generando preparazione...
        </motion.p>
        <p className="text-sm text-muted-foreground">
          L&apos;IA sta analizzando le debolezze degli studenti
        </p>
      </div>
    </motion.div>
  )
}

/* ─── Preparation Card ───────────────────────────────────────── */

function PreparationCard({
  preparation,
  defaultOpen = false,
}: {
  preparation: PreparationItem
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const content = preparation.content as Record<string, unknown>
  const objectives = (content.objectives as string[]) || []
  const activities = (content.activities as Activity[]) || []
  const exercises = (content.exercises as Exercise[]) || []
  const homework = (content.homework as string[]) || []
  const notes = (content.notes as string[]) || []
  const level = content.level as string | undefined

  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/30 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md shrink-0">
                    <BookOpen className="size-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">
                      {preparation.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-0.5">
                      <Clock className="size-3" />
                      {new Date(preparation.generatedAt).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {level && (
                        <>
                          <span>·</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {level}
                          </Badge>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <ChevronDown className="size-5 text-muted-foreground" />
                </motion.div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-6 space-y-5">
              {/* Objectives */}
              {objectives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Target className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Obiettivi
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {objectives.map((obj, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                          •
                        </span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Activities */}
              {activities.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Dumbbell className="size-4 text-teal-600 dark:text-teal-400" />
                    Attività
                  </div>
                  <div className="space-y-2 pl-6">
                    {activities.map((act, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-accent/20 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{act.name || `Attività ${i + 1}`}</p>
                          {act.duration && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              <Clock className="size-3 mr-0.5" />
                              {act.duration}
                            </Badge>
                          )}
                        </div>
                        {act.description && (
                          <p className="text-xs text-muted-foreground">
                            {act.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercises */}
              {exercises.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ListChecks className="size-4 text-amber-600 dark:text-amber-400" />
                    Esercizi
                  </div>
                  <div className="space-y-2 pl-6">
                    {exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-accent/20 p-3 space-y-1"
                      >
                        {ex.type && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          >
                            {ex.type}
                          </Badge>
                        )}
                        {ex.instruction && (
                          <p className="text-sm text-muted-foreground">
                            {ex.instruction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Homework */}
              {homework.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Home className="size-4 text-orange-600 dark:text-orange-400" />
                    Compiti
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {homework.map((hw, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-orange-500 dark:text-orange-400 mt-0.5 shrink-0">
                          •
                        </span>
                        {hw}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {notes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <StickyNote className="size-4 text-muted-foreground" />
                    Note
                  </div>
                  <ul className="space-y-1.5 pl-6">
                    {notes.map((n, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-muted-foreground/60 mt-0.5 shrink-0">
                          •
                        </span>
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  )
}

/* ─── Class Preparations Component ───────────────────────────── */

export function ClassPreparations() {
  const { essays, preparations, fetchPreparations } = useAppStore()

  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [newlyGeneratedId, setNewlyGeneratedId] = useState<string | null>(null)

  /* ─── Extract Weaknesses from Corrected Essays ─────────────── */

  const extractWeaknesses = useCallback((): {
    weaknesses: string[]
    averageScore: number
  } => {
    const correctedEssays = essays.filter(
      (e) => e.status === 'CORRECTED' && e.aiCorrection !== null
    )

    if (correctedEssays.length === 0) {
      return { weaknesses: [], averageScore: 0 }
    }

    // Collect all errors by type and study topics
    const errorTypeCounts: Record<string, number> = {}
    const allStudyTopics: string[] = []
    let totalScore = 0

    for (const essay of correctedEssays) {
      const correction = essay.aiCorrection as AICorrection | null
      if (!correction) continue

      // Count error types
      if (correction.errors && Array.isArray(correction.errors)) {
        for (const error of correction.errors) {
          const type = error.type || 'unknown'
          errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1
        }
      }

      // Collect study topics
      if (correction.studyTopics && Array.isArray(correction.studyTopics)) {
        allStudyTopics.push(...correction.studyTopics)
      }

      // Accumulate score
      if (essay.aiScore !== null) {
        totalScore += essay.aiScore
      }
    }

    const averageScore = correctedEssays.length > 0
      ? totalScore / correctedEssays.length
      : 0

    // Build weaknesses array: error types (sorted by frequency) + unique study topics
    const weaknesses: string[] = []

    // Add error types as weaknesses (most frequent first)
    const sortedErrorTypes = Object.entries(errorTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => `${type} (${count} occorrenze)`)

    weaknesses.push(...sortedErrorTypes)

    // Add unique study topics
    const uniqueTopics = [...new Set(allStudyTopics)]
    weaknesses.push(...uniqueTopics)

    return { weaknesses, averageScore }
  }, [essays])

  /* ─── Detect CEFR Level from Score ─────────────────────────── */

  const detectLevel = useCallback((averageScore: number): string => {
    if (averageScore >= 90) return 'C2'
    if (averageScore >= 80) return 'C1'
    if (averageScore >= 70) return 'B2'
    if (averageScore >= 55) return 'B1'
    if (averageScore >= 40) return 'A2'
    return 'A1'
  }, [])

  /* ─── Generate AI Preparation ──────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    const { weaknesses, averageScore } = extractWeaknesses()

    if (weaknesses.length === 0) {
      toast.error('Nessuna debolezza trovata. Correggi almeno un saggio prima di generare una preparazione.')
      return
    }

    const level = detectLevel(averageScore)

    setIsGenerating(true)
    try {
      const data = await apiFetch<GenerateResponse>('/api/preparations/generate', {
        method: 'POST',
        body: JSON.stringify({
          weaknesses,
          level,
        }),
      })

      toast.success('Preparazione generata con successo!')
      await fetchPreparations()

      // Auto-expand the new preparation
      if (data.preparation?.id) {
        setNewlyGeneratedId(data.preparation.id)
      }
    } catch {
      toast.error('Errore nella generazione. Riprova.')
    } finally {
      setIsGenerating(false)
    }
  }, [extractWeaknesses, detectLevel, fetchPreparations])

  /* ─── Clear newly generated ID after expansion ─────────────── */

  useEffect(() => {
    if (newlyGeneratedId) {
      const timer = setTimeout(() => setNewlyGeneratedId(null), 500)
      return () => clearTimeout(timer)
    }
  }, [newlyGeneratedId])

  /* ─── Check if there are corrected essays ──────────────────── */

  const hasCorrectedEssays = essays.some(
    (e) => e.status === 'CORRECTED' && e.aiCorrection !== null
  )

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <>
      {/* Loading overlay during AI generation */}
      <AnimatePresence>
        {isGenerating && <LoadingOverlay />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="size-7 text-emerald-600 dark:text-emerald-400" />
              Preparazioni di Classe
            </h2>
            <p className="text-muted-foreground mt-1">
              Genera lezioni personalizzate basate sulle debolezze degli studenti con l&apos;AI.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !hasCorrectedEssays}
            className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md"
          >
            {isGenerating ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            Genera Preparazione AI
          </Button>
        </div>

        {/* Info card when no corrected essays */}
        {!hasCorrectedEssays && (
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Nessun saggio corretto disponibile
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per generare una preparazione AI, hai bisogno di almeno un saggio corretto.
                    Le debolezze degli studenti verranno analizzate automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preparations List */}
        {preparations.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              <BookOpen className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nessuna preparazione.</p>
              <p className="text-sm mt-1">Genera la prima preparazione con AI!</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {preparations.map((prep) => (
              <PreparationCard
                key={prep.id}
                preparation={prep}
                defaultOpen={prep.id === newlyGeneratedId}
              />
            ))}
          </motion.div>
        )}

        {/* Weakness Summary (when corrected essays exist) */}
        {hasCorrectedEssays && (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-teal-600 dark:text-teal-400" />
                Riepilogo Debolezze
              </CardTitle>
              <CardDescription>
                Analisi automatica dei saggi corretti dei tuoi studenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeaknessSummary />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </>
  )
}

/* ─── Weakness Summary Sub-Component ─────────────────────────── */

function WeaknessSummary() {
  const { essays } = useAppStore()

  const correctedEssays = essays.filter(
    (e) => e.status === 'CORRECTED' && e.aiCorrection !== null
  )

  // Aggregate error types
  const errorTypeCounts: Record<string, number> = {}
  const studyTopicsSet = new Set<string>()
  let totalScore = 0
  let scoreCount = 0

  for (const essay of correctedEssays) {
    const correction = essay.aiCorrection as AICorrection | null
    if (!correction) continue

    if (correction.errors && Array.isArray(correction.errors)) {
      for (const error of correction.errors) {
        const type = error.type || 'unknown'
        errorTypeCounts[type] = (errorTypeCounts[type] || 0) + 1
      }
    }

    if (correction.studyTopics && Array.isArray(correction.studyTopics)) {
      for (const topic of correction.studyTopics) {
        studyTopicsSet.add(topic)
      }
    }

    if (essay.aiScore !== null) {
      totalScore += essay.aiScore
      scoreCount++
    }
  }

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

  // Italian labels for error types
  const errorTypeLabels: Record<string, string> = {
    grammar: 'Grammatica',
    spelling: 'Ortografia',
    syntax: 'Sintassi',
    punctuation: 'Punteggiatura',
    vocabulary: 'Vocabolario',
    style: 'Stile',
    unknown: 'Altro',
  }

  const sortedErrors = Object.entries(errorTypeCounts)
    .sort(([, a], [, b]) => b - a)

  const studyTopics = Array.from(studyTopicsSet)

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-accent/30">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {correctedEssays.length}
          </p>
          <p className="text-xs text-muted-foreground">Saggi corretti</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-accent/30">
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {Object.values(errorTypeCounts).reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Errori totali</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-accent/30">
          <p
            className={`text-2xl font-bold ${
              averageScore >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : averageScore >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {averageScore}
          </p>
          <p className="text-xs text-muted-foreground">Punteggio medio</p>
        </div>
      </div>

      {/* Error types */}
      {sortedErrors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Tipi di errore</p>
          <div className="flex flex-wrap gap-2">
            {sortedErrors.map(([type, count]) => (
              <Badge
                key={type}
                variant="outline"
                className="bg-red-500/5 text-red-700 dark:text-red-400 border-red-500/20"
              >
                {errorTypeLabels[type] || type} ×{count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Study topics */}
      {studyTopics.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Argomenti di studio</p>
          <div className="flex flex-wrap gap-2">
            {studyTopics.map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="bg-teal-500/5 text-teal-700 dark:text-teal-400 border-teal-500/20"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {sortedErrors.length === 0 && studyTopics.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nessun dato disponibile. Correggi i saggi degli studenti per vedere il riepilogo.
        </p>
      )}
    </div>
  )
}
