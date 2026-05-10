'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { apiFetch } from '@/components/scribia/api-fetch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Star,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PenLine,
  Sparkles,
  BookMarked,
  Type,
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  Brain,
  Link2,
} from 'lucide-react'

/* ─── Types ──────────────────────────────────────────────────── */

interface CorrectionError {
  type: 'grammar' | 'spelling' | 'punctuation' | 'syntax' | 'vocabulary' | 'style'
  original: string
  correction: string
  explanation: string
  position: number
}

interface CorrectionSuggestions {
  connectors: string[]
  synonyms: Array<{ word: string; alternatives: string[] }>
}

interface AICorrection {
  correctedText: string
  score: number
  errors: CorrectionError[]
  grammarNotes: string[]
  vocabularyNotes: string[]
  styleNotes: string[]
  suggestions: CorrectionSuggestions
  studyTopics: string[]
  selfAssessment?: {
    selfScore: number
    selfNotes: string
    submittedAt: string
  }
}

/* ─── Error type config ──────────────────────────────────────── */

const ERROR_TYPE_CONFIG: Record<
  CorrectionError['type'],
  { label: string; color: string; bgColor: string; underlineClass: string; badgeClass: string; cefrLevel: string }
> = {
  grammar: {
    label: 'Grammatica',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    underlineClass: 'underline decoration-red-500 decoration-2 underline-offset-4',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    cefrLevel: 'A2–B1',
  },
  spelling: {
    label: 'Ortografia',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    underlineClass: 'underline decoration-red-500 decoration-2 underline-offset-4',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    cefrLevel: 'A1–A2',
  },
  syntax: {
    label: 'Sintassi',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    underlineClass: 'underline decoration-red-500 decoration-2 underline-offset-4',
    badgeClass: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    cefrLevel: 'B1–B2',
  },
  punctuation: {
    label: 'Punteggiatura',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    underlineClass: 'underline decoration-amber-500 decoration-2 underline-offset-4',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    cefrLevel: 'A2–B1',
  },
  vocabulary: {
    label: 'Vocabolario',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    underlineClass: 'underline decoration-amber-400 decoration-2 underline-offset-4',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    cefrLevel: 'B1–C1',
  },
  style: {
    label: 'Stile',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10',
    underlineClass: 'underline decoration-teal-500 decoration-2 underline-offset-4',
    badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    cefrLevel: 'B2–C2',
  },
}

/* ─── Animated Circular Score ────────────────────────────────── */

function AnimatedScore({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  const color = score >= 70
    ? { stroke: 'stroke-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'text-emerald-500/20' }
    : score >= 40
    ? { stroke: 'stroke-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'text-amber-500/20' }
    : { stroke: 'stroke-red-500', text: 'text-red-600 dark:text-red-400', bg: 'text-red-500/20' }

  const radius = 58
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className={color.bg}
        />
        {/* Progress circle */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={color.stroke}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-3xl font-bold ${color.text}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  )
}

/* ─── Annotated Text ─────────────────────────────────────────── */

function AnnotatedText({ content, errors }: { content: string; errors: CorrectionError[] }) {
  if (!errors || errors.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    )
  }

  // Sort errors by position
  const sortedErrors = [...errors].sort((a, b) => a.position - b.position)

  // Check if positions are valid (within text bounds)
  const hasValidPositions = sortedErrors.some(
    (e) => e.position >= 0 && e.position < content.length
  )

  if (!hasValidPositions) {
    // Show plain text with error list below
    return (
      <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    )
  }

  // Build annotated text segments
  const segments: Array<{ text: string; error?: CorrectionError }> = []
  let lastPos = 0

  for (const error of sortedErrors) {
    if (error.position < lastPos || error.position >= content.length) continue

    // Text before error
    if (error.position > lastPos) {
      segments.push({ text: content.slice(lastPos, error.position) })
    }

    // Error text
    const errorLength = error.original.length
    const endPos = Math.min(error.position + errorLength, content.length)
    segments.push({ text: content.slice(error.position, endPos), error })

    lastPos = endPos
  }

  // Remaining text
  if (lastPos < content.length) {
    segments.push({ text: content.slice(lastPos) })
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.error ? (
          <span
            key={i}
            className={ERROR_TYPE_CONFIG[seg.error.type].underlineClass}
            title={seg.error.explanation}
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  )
}

/* ─── Error Card with Collapsible ────────────────────────────── */

function ErrorCard({ error, index }: { error: CorrectionError; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const config = ERROR_TYPE_CONFIG[error.type]

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`flex size-7 items-center justify-center rounded-md shrink-0 mt-0.5 ${config.bgColor}`}>
              <span className={`text-xs font-bold ${config.color}`}>{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={config.badgeClass}>
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="line-through text-red-600 dark:text-red-400 font-medium">
                  {error.original}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {error.correction}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{error.explanation}</p>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isOpen ? (
                <ChevronDown className="size-3.5 mr-1" />
              ) : (
                <ChevronRight className="size-3.5 mr-1" />
              )}
              Clicca per i dettagli completi
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Separator className="my-3" />
              <div className="space-y-3 pl-10">
                {/* Theoretical explanation */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Regola Grammaticale
                  </h5>
                  <p className="text-sm leading-relaxed">{error.explanation}</p>
                </div>

                {/* Examples */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Esempi
                  </h5>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="size-3.5 text-red-500 shrink-0" />
                      <span className="line-through text-red-600 dark:text-red-400">{error.original}</span>
                      <span className="text-xs text-muted-foreground">(errato)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400">{error.correction}</span>
                      <span className="text-xs text-muted-foreground">(corretto)</span>
                    </div>
                  </div>
                </div>

                {/* CEFR Level */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Livello QCER
                  </h5>
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="size-3 mr-1" />
                    {config.cefrLevel}
                  </Badge>
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}

/* ─── Self-Assessment Dialog ─────────────────────────────────── */

function SelfAssessmentDialog({
  essayId,
  existingAssessment,
  onComplete,
}: {
  essayId: string
  existingAssessment?: AICorrection['selfAssessment']
  onComplete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [errorsReviewed, setErrorsReviewed] = useState(false)
  const [selfScore, setSelfScore] = useState(50)
  const [selfNotes, setSelfNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { currentEssay } = useAppStore()
  const correction = currentEssay?.aiCorrection as AICorrection | null
  const errors = correction?.errors || []

  // Read-only if already assessed
  const isReadOnly = !!existingAssessment

  const handleSubmit = async () => {
    if (isReadOnly) return
    setIsSubmitting(true)
    try {
      await apiFetch(`/api/essays/${essayId}/self-assess`, {
        method: 'POST',
        body: JSON.stringify({ selfScore, selfNotes }),
      })
      toast.success('Autovalutazione salvata con successo!')
      setOpen(false)
      setStep(0)
      setErrorsReviewed(false)
      setSelfScore(50)
      setSelfNotes('')
      onComplete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel salvataggio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { label: 'Rivedere errori', icon: AlertTriangle },
    { label: 'Auto-punteggio', icon: Star },
    { label: 'Riflessione', icon: Brain },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          <ClipboardCheck className="size-4" />
          Autovalutazione
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Autovalutazione</DialogTitle>
          <DialogDescription>
            {isReadOnly
              ? 'La tua autovalutazione per questo tema.'
              : 'Rifletti sul tuo lavoro e valuta il tuo tema.'}
          </DialogDescription>
        </DialogHeader>

        {isReadOnly ? (
          /* ─── Read-only view ─── */
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center py-4">
              <AnimatedScore score={existingAssessment.selfScore} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Il tuo punteggio</h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {existingAssessment.selfScore}/100
              </p>
            </div>
            {existingAssessment.selfNotes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Le tue note</h4>
                <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                  {existingAssessment.selfNotes}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── Interactive 3-step view ─── */
          <div className="space-y-4 py-2">
            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {steps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => i < step && setStep(i)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        i === step
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : i < step
                          ? 'bg-muted text-muted-foreground hover:bg-accent/50'
                          : 'text-muted-foreground opacity-50'
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-px bg-border" />
                    )}
                  </div>
                )
              })}
            </div>

            <Separator />

            <AnimatePresence mode="wait">
              {/* Step 0: Review errors */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <h4 className="text-sm font-semibold">Rivedere errori</h4>
                  {errors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nessun errore trovato nella correzione AI.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Sono stati trovati <strong>{errors.length}</strong> errori nel tuo testo.
                        Ecco un riepilogo:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
                        {errors.map((err, i) => {
                          const config = ERROR_TYPE_CONFIG[err.type]
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50"
                            >
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.badgeClass}`}>
                                {config.label}
                              </Badge>
                              <span className="line-through text-red-600 dark:text-red-400">
                                {err.original}
                              </span>
                              <ArrowRight className="size-3 text-muted-foreground" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {err.correction}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="errors-reviewed"
                      checked={errorsReviewed}
                      onCheckedChange={(checked) =>
                        setErrorsReviewed(checked === true)
                      }
                    />
                    <label
                      htmlFor="errors-reviewed"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Ho revisionato tutti gli errori
                    </label>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Self-score */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h4 className="text-sm font-semibold">Auto-punteggio</h4>
                  <p className="text-sm text-muted-foreground">
                    Quanto pensi di meritare per questo tema?
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    <AnimatedScore score={selfScore} />
                    <Slider
                      value={[selfScore]}
                      onValueChange={(v) => setSelfScore(v[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full max-w-xs"
                    />
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {selfScore}/100
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Reflection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <h4 className="text-sm font-semibold">Riflessione</h4>
                  <p className="text-sm text-muted-foreground">
                    Cosa hai imparato? Cosa miglioreresti la prossima volta?
                  </p>
                  <Textarea
                    value={selfNotes}
                    onChange={(e) => setSelfNotes(e.target.value)}
                    placeholder="Scrivi qui la tua riflessione..."
                    rows={5}
                    className="resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <DialogFooter>
          {!isReadOnly && (
            <div className="flex w-full justify-between">
              <Button
                variant="ghost"
                onClick={() => {
                  if (step > 0) setStep(step - 1)
                  else setOpen(false)
                }}
              >
                {step === 0 ? 'Annulla' : 'Indietro'}
              </Button>

              {step < 2 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 0 && !errorsReviewed}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                >
                  Avanti
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                >
                  {isSubmitting && <Loader2 className="size-4 mr-1 animate-spin" />}
                  Salva
                </Button>
              )}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Fade-in animation wrapper ──────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */

export function EssayDetail() {
  const { currentEssay, setCurrentView, setCurrentEssay, fetchEssays, user } =
    useAppStore()

  // Redirect if no essay
  useEffect(() => {
    if (!currentEssay) {
      setCurrentView('dashboard')
    }
  }, [currentEssay, setCurrentView])

  if (!currentEssay) return null

  const correction = currentEssay.aiCorrection as AICorrection | null
  const isCorrected = currentEssay.status === 'CORRECTED'
  const errors = correction?.errors || []
  const score = currentEssay.aiScore ?? correction?.score ?? 0

  const handleRefresh = async () => {
    await fetchEssays()
    // Re-find the current essay in the refreshed list
    const store = useAppStore.getState()
    const updated = store.essays.find((e) => e.id === currentEssay.id)
    if (updated) {
      setCurrentEssay(updated)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentView(
                  user?.role === 'STUDENT' ? 'essay-editor' : 'dashboard'
                )
              }
              className="shrink-0"
            >
              <ArrowLeft className="size-4 mr-1" /> Indietro
            </Button>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {currentEssay.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentEssay.studentName && (
                  <span>{currentEssay.studentName} · </span>
                )}
                {new Date(currentEssay.createdAt).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={
                isCorrected
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }
            >
              {isCorrected ? (
                <CheckCircle2 className="size-3 mr-1" />
              ) : (
                <AlertCircle className="size-3 mr-1" />
              )}
              {isCorrected ? 'Corretto' : currentEssay.status}
            </Badge>
            {isCorrected && correction && (
              <SelfAssessmentDialog
                essayId={currentEssay.id}
                existingAssessment={correction.selfAssessment}
                onComplete={handleRefresh}
              />
            )}
          </div>
        </div>
      </FadeIn>

      {/* ─── Not corrected yet ─── */}
      {!isCorrected && (
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
                <PenLine className="size-12 mb-3 opacity-30" />
                <p className="text-lg font-medium mb-1">Questo saggio non è ancora stato corretto</p>
                <p className="text-sm">
                  Il testo originale è mostrato sotto. La correzione AI apparirà qui quando sarà disponibile.
                </p>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="text-sm font-semibold mb-2">Testo Originale</h4>
                <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
                  {currentEssay.content}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* ─── Corrected essay: full detail ─── */}
      {isCorrected && correction && (
        <>
          {/* ─── Score card ─── */}
          <FadeIn delay={0.1}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <AnimatedScore score={score} />
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <h3 className="text-lg font-semibold">Punteggio AI</h3>
                    <p className="text-sm text-muted-foreground">
                      {score >= 70
                        ? 'Ottimo lavoro! Il tuo testo dimostra una buona padronanza della lingua italiana.'
                        : score >= 40
                        ? 'Buon tentativo! Ci sono aspetti che possono essere migliorati.'
                        : 'Il testo necessita di miglioramenti significati. Continua a esercitarti!'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {errors.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="size-3 mr-1" />
                          {errors.length} {errors.length === 1 ? 'errore' : 'errori'}
                        </Badge>
                      )}
                      {(correction.grammarNotes?.length ?? 0) > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="size-3 mr-1" />
                          {correction.grammarNotes!.length} note grammaticali
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* ─── Tabs: Original | Corrected | Errors | Suggestions ─── */}
          <FadeIn delay={0.2}>
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="w-full sm:w-auto flex-wrap">
                <TabsTrigger value="original" className="gap-1.5">
                  <PenLine className="size-3.5" />
                  <span className="hidden sm:inline">Originale</span>
                </TabsTrigger>
                <TabsTrigger value="corrected" className="gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span className="hidden sm:inline">Corretto</span>
                </TabsTrigger>
                <TabsTrigger value="errors" className="gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  <span className="hidden sm:inline">Errori</span>
                  {errors.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                      {errors.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="gap-1.5">
                  <Lightbulb className="size-3.5" />
                  <span className="hidden sm:inline">Suggerimenti</span>
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab: Original with annotations ─── */}
              <TabsContent value="original">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenLine className="size-4 text-muted-foreground" />
                      Testo Originale con Annotazioni
                    </CardTitle>
                    <CardDescription>
                      Le parti sottolineate indicano gli errori rilevati dall&apos;AI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnnotatedText content={currentEssay.content} errors={errors} />
                    {/* Legend */}
                    {errors.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="underline decoration-red-500 decoration-2 underline-offset-4">
                            Grammatica/Ortografia/Sintassi
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="underline decoration-amber-400 decoration-2 underline-offset-4">
                            Punteggiatura/Vocabolario
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="underline decoration-teal-500 decoration-2 underline-offset-4">
                            Stile
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Tab: Corrected text ─── */}
              <TabsContent value="corrected">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Testo Corretto
                    </CardTitle>
                    <CardDescription>
                      La versione corretta del tuo testo generata dall&apos;AI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/30 text-sm leading-relaxed whitespace-pre-wrap">
                      {correction.correctedText || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Tab: Errors ─── */}
              <TabsContent value="errors">
                <div className="space-y-4">
                  {/* Grammar errors section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-500" />
                        Errori Grammaticali
                      </CardTitle>
                      <CardDescription>
                        Clicca su ogni errore per vedere la spiegazione completa e la regola grammaticale.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {errors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="size-10 mx-auto mb-2 opacity-30" />
                          <p>Nessun errore trovato!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                          {errors.map((error, i) => (
                            <ErrorCard key={i} error={error} index={i} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Grammar notes */}
                  {correction.grammarNotes && correction.grammarNotes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookOpen className="size-4 text-emerald-500" />
                          Note Grammaticali
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {correction.grammarNotes.map((note, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <BookMarked className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* ─── Tab: Suggestions ─── */}
              <TabsContent value="suggestions">
                <div className="space-y-4">
                  {/* Vocabulary section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Type className="size-4 text-amber-500" />
                        Vocabolario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Vocabulary notes */}
                      {correction.vocabularyNotes && correction.vocabularyNotes.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Note sul Vocabolario</h5>
                          <ul className="space-y-2">
                            {correction.vocabularyNotes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <MessageSquare className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Synonyms */}
                      {correction.suggestions?.synonyms &&
                        correction.suggestions.synonyms.length > 0 && (
                          <div>
                            <Separator className="mb-4" />
                            <h5 className="text-sm font-semibold mb-3">Sinonimi Suggeriti</h5>
                            <div className="space-y-3">
                              {correction.suggestions.synonyms.map((syn, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-sm font-medium border-amber-300 dark:border-amber-700"
                                  >
                                    {syn.word}
                                  </Badge>
                                  <ArrowRight className="size-3.5 text-muted-foreground" />
                                  {syn.alternatives.map((alt, j) => (
                                    <Badge
                                      key={j}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {alt}
                                    </Badge>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {(!correction.vocabularyNotes?.length &&
                        !correction.suggestions?.synonyms?.length) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessun suggerimento sul vocabolario.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Style section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="size-4 text-teal-500" />
                        Stile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Style notes */}
                      {correction.styleNotes && correction.styleNotes.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Note sullo Stile</h5>
                          <ul className="space-y-2">
                            {correction.styleNotes.map((note, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <Sparkles className="size-4 text-teal-500 shrink-0 mt-0.5" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Connectors */}
                      {correction.suggestions?.connectors &&
                        correction.suggestions.connectors.length > 0 && (
                          <div>
                            <Separator className="mb-4" />
                            <h5 className="text-sm font-semibold mb-3">Connettori Suggeriti</h5>
                            <div className="flex flex-wrap gap-2">
                              {correction.suggestions.connectors.map((conn, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs border-teal-300 dark:border-teal-700"
                                >
                                  <Link2 className="size-3 mr-1" />
                                  {conn}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {(!correction.styleNotes?.length &&
                        !correction.suggestions?.connectors?.length) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessun suggerimento sullo stile.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Study topics */}
                  {correction.studyTopics && correction.studyTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <GraduationCap className="size-4 text-emerald-500" />
                          Argomenti di Studio Suggeriti
                        </CardTitle>
                        <CardDescription>
                          Argomenti da rivedere per migliorare le tue competenze linguistiche.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {correction.studyTopics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <GraduationCap className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Self-assessment summary if exists */}
                  {correction.selfAssessment && (
                    <Card className="border-emerald-200 dark:border-emerald-800/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ClipboardCheck className="size-4 text-emerald-500" />
                          La Tua Autovalutazione
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {correction.selfAssessment.selfScore}/100
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Punteggio auto-assegnato
                          </span>
                        </div>
                        {correction.selfAssessment.selfNotes && (
                          <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                            {correction.selfAssessment.selfNotes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </FadeIn>
        </>
      )}

      {/* ─── Teacher notes ─── */}
      {currentEssay.teacherNotes && (
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="size-4 text-amber-500" />
                Note dell&apos;Insegnante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-200/50 dark:border-amber-800/30 text-sm whitespace-pre-wrap">
                {currentEssay.teacherNotes}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  )
}
