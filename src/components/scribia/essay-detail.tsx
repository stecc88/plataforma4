'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { apiFetch } from '@/components/scribia/api-fetch'
import type {
  AICorrection,
  CorrectionError,
  ErrorType,
  StrengthCategory,
  ScoreBreakdown,
  CertificationType,
} from '@/lib/ai-correction.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PenLine,
  Sparkles,
  Type,
  ArrowRight,
  GraduationCap,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  Brain,
  Link2,
  Award,
  Target,
  BookMarked,
  MessageSquare,
  Quote,
  Repeat,
  ListChecks,
  Heart,
} from 'lucide-react'

/* ─── Error type config ──────────────────────────────────────── */

const ERROR_TYPE_CONFIG: Record<
  ErrorType,
  {
    label: string
    color: string
    bgColor: string
    underlineClass: string
    badgeClass: string
    cefrLevel: string
  }
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

/* ─── Strength category config ───────────────────────────────── */

const STRENGTH_CATEGORY_CONFIG: Record<
  StrengthCategory,
  { label: string; icon: typeof Star; color: string; bgColor: string }
> = {
  connectors: {
    label: 'Connettivi',
    icon: Link2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  vocabulary: {
    label: 'Vocabolario',
    icon: Type,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  structure: {
    label: 'Struttura',
    icon: BookOpen,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10',
  },
  style: {
    label: 'Stile',
    icon: PenLine,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10',
  },
  coherence: {
    label: 'Coerenza',
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  other: {
    label: 'Altro',
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

/* ─── Score breakdown config ─────────────────────────────────── */

const SCORE_BREAKDOWN_LABELS: Record<keyof ScoreBreakdown, { label: string; icon: typeof Target; color: string }> = {
  communicativeAdequacy: {
    label: 'Adeguamento comunicativo',
    icon: MessageSquare,
    color: 'bg-sky-500',
  },
  grammaticalAccuracy: {
    label: 'Correttezza grammaticale',
    icon: GraduationCap,
    color: 'bg-red-500',
  },
  lexicalRichness: {
    label: 'Ricchezza lessicale',
    icon: Type,
    color: 'bg-amber-500',
  },
  textualCohesion: {
    label: 'Coesione testuale',
    icon: Link2,
    color: 'bg-emerald-500',
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

/* ─── Marked Text Renderer ───────────────────────────────────── */

function MarkedTextRenderer({ markedText }: { markedText: string }) {
  const segments = useMemo(() => {
    if (!markedText) return []
    const result: Array<{
      type: 'text' | 'error' | 'suggestion'
      content: string
      correction?: string
    }> = []

    // Combined regex: matches ~~error~~ → **correction** OR [original] → {better}
    const pattern = /~~([^~]+)~~\s*→\s*\*\*([^*]+)\*\*|\[([^\]]+)\]\s*→\s*\{([^}]+)\}/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(markedText)) !== null) {
      // Text before the match
      if (match.index > lastIndex) {
        result.push({ type: 'text', content: markedText.slice(lastIndex, match.index) })
      }

      if (match[1] !== undefined) {
        // ~~error~~ → **correction** pattern
        result.push({ type: 'error', content: match[1], correction: match[2] })
      } else if (match[3] !== undefined) {
        // [original] → {better} pattern
        result.push({ type: 'suggestion', content: match[3], correction: match[4] })
      }

      lastIndex = match.index + match[0].length
    }

    // Remaining text
    if (lastIndex < markedText.length) {
      result.push({ type: 'text', content: markedText.slice(lastIndex) })
    }

    return result
  }, [markedText])

  if (segments.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
        {markedText || 'N/A'}
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50 text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'error') {
          return (
            <span key={i} className="inline">
              <span className="line-through text-red-600 dark:text-red-400 bg-red-500/10 px-0.5 rounded">
                {seg.content}
              </span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-0.5 rounded">
                {seg.correction}
              </span>
            </span>
          )
        }
        if (seg.type === 'suggestion') {
          return (
            <span key={i} className="inline">
              <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-0.5 rounded line-through decoration-amber-400/60">
                {seg.content}
              </span>
              <span className="mx-1 text-muted-foreground">→</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-0.5 rounded">
                {seg.correction}
              </span>
            </span>
          )
        }
        return <span key={i}>{seg.content}</span>
      })}
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
            {/* Error number badge */}
            <div className={`flex size-7 items-center justify-center rounded-md shrink-0 mt-0.5 ${config.bgColor}`}>
              <span className={`text-xs font-bold ${config.color}`}>{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Category + type badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={config.badgeClass}>
                  {config.label}
                </Badge>
                {error.category && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/20">
                    {error.category}
                  </Badge>
                )}
              </div>

              {/* Original → Correction */}
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="line-through text-red-600 dark:text-red-400 font-medium">
                  {error.original}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {error.correction}
                </span>
              </div>

              {/* Occurrences indicator */}
              {error.occurrences > 1 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    ×{error.occurrences}
                  </Badge>
                  {error.occurrencePositions && (
                    <span>{error.occurrencePositions}</span>
                  )}
                </div>
              )}
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
                {/* Theoretical explanation (regola) */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Regola Grammaticale
                  </h5>
                  <p className="text-sm leading-relaxed">{error.regola}</p>
                </div>

                {/* Examples */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Esempi
                  </h5>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 text-sm">
                      <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>{error.exampleWrong}</span>
                      <span className="text-xs text-muted-foreground shrink-0">(errato)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{error.exampleCorrect}</span>
                      <span className="text-xs text-muted-foreground shrink-0">(corretto)</span>
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
              <AnimatedScore score={existingAssessment!.selfScore} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Il tuo punteggio</h4>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {existingAssessment!.selfScore}/100
              </p>
            </div>
            {existingAssessment!.selfNotes && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Le tue note</h4>
                <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                  {existingAssessment!.selfNotes}
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

/* ─── Score Breakdown Bar ────────────────────────────────────── */

function ScoreBreakdownBar({
  label,
  value,
  max,
  colorClass,
  icon: Icon,
}: {
  label: string
  value: number
  max: number
  colorClass: string
  icon: typeof Target
}) {
  const percentage = Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-semibold tabular-nums">
          {value}/{max}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

/* ─── Certification Badge ────────────────────────────────────── */

function CertificationBadge({ certification }: { certification: CertificationType }) {
  const isPlida = certification === 'PLIDA'
  return (
    <Badge
      className={`gap-1 ${
        isPlida
          ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
          : 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800'
      }`}
    >
      <Award className="size-3" />
      {certification}
    </Badge>
  )
}

/* ─── Strength Card ──────────────────────────────────────────── */

function StrengthCard({ strength }: { strength: AICorrection['strengths'][number] }) {
  const config = STRENGTH_CATEGORY_CONFIG[strength.category]
  const Icon = config.icon

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex size-8 items-center justify-center rounded-md shrink-0 ${config.bgColor}`}>
            <Icon className={`size-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{strength.label}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color} border-current/20`}>
                {config.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {strength.description}
            </p>
            {strength.examples.length > 0 && (
              <div className="space-y-1 pt-1">
                {strength.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-xs bg-emerald-500/5 dark:bg-emerald-500/10 rounded px-2 py-1"
                  >
                    <Quote className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="italic text-emerald-700 dark:text-emerald-300">&ldquo;{ex}&rdquo;</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
  const strengths = correction?.strengths || []
  const score = currentEssay.aiScore ?? correction?.score ?? 0

  const certification = correction?.certification ?? 'CILS'
  const level = correction?.level ?? ''
  const scoreBreakdown = correction?.scoreBreakdown
  const isCILS = certification === 'CILS'
  const breakdownMax = isCILS ? 5 : 25

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
          {/* ─── Enhanced Score Card ─── */}
          <FadeIn delay={0.1}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <AnimatedScore score={score} />
                  <div className="flex-1 text-center sm:text-left space-y-3 w-full">
                    {/* Title + badges */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Punteggio AI</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <CertificationBadge certification={certification} />
                        {level && (
                          <Badge variant="outline" className="gap-1">
                            <GraduationCap className="size-3" />
                            {level}
                          </Badge>
                        )}
                        {errors.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <AlertTriangle className="size-3 mr-1" />
                            {errors.length} {errors.length === 1 ? 'errore' : 'errori'}
                          </Badge>
                        )}
                        {strengths.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Star className="size-3 mr-1" />
                            {strengths.length} {strengths.length === 1 ? 'punto forte' : 'punti forti'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Score description */}
                    <p className="text-sm text-muted-foreground">
                      {score >= 70
                        ? 'Ottimo lavoro! Il tuo testo dimostra una buona padronanza della lingua italiana.'
                        : score >= 40
                        ? 'Buon tentativo! Ci sono aspetti che possono essere migliorati.'
                        : 'Il testo necessita di miglioramenti significativi. Continua a esercitarti!'}
                    </p>

                    {/* Score breakdown bars */}
                    {scoreBreakdown && (
                      <div className="space-y-2 pt-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Dettaglio punteggio
                        </h4>
                        <div className="space-y-2.5">
                          {(Object.keys(SCORE_BREAKDOWN_LABELS) as Array<keyof ScoreBreakdown>).map((key) => {
                            const cfg = SCORE_BREAKDOWN_LABELS[key]
                            return (
                              <ScoreBreakdownBar
                                key={key}
                                label={cfg.label}
                                value={scoreBreakdown[key]}
                                max={breakdownMax}
                                colorClass={cfg.color}
                                icon={cfg.icon}
                              />
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {isCILS
                            ? 'Criteri di valutazione CILS — ogni area /5'
                            : 'Criteri di valutazione PLIDA — ogni area /25'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* ─── Tabs: Marked Text | Corrected | Errors | Strengths & Suggestions ─── */}
          <FadeIn delay={0.2}>
            <Tabs defaultValue="marked" className="w-full">
              <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="marked" className="gap-1.5">
                  <PenLine className="size-3.5" />
                  <span className="hidden sm:inline">Con Marcature</span>
                  <span className="sm:hidden">Marcature</span>
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
                <TabsTrigger value="strengths" className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  <span className="hidden sm:inline">Punti Forti e Suggerimenti</span>
                  <span className="sm:hidden">Forzi e Suggerimenti</span>
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab: Marked Text ─── */}
              <TabsContent value="marked">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <PenLine className="size-4 text-muted-foreground" />
                      Testo con Marcature
                    </CardTitle>
                    <CardDescription>
                      Il testo originale con le correzioni evidenziate inline dall&apos;AI.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MarkedTextRenderer markedText={correction.markedText} />
                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="line-through text-red-600 dark:text-red-400 bg-red-500/10 px-1 rounded">errato</span>
                        <span className="mx-0.5">→</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 rounded">correzione</span>
                        <span className="ml-1">Correzione</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="line-through text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">termine</span>
                        <span className="mx-0.5">→</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1 rounded">alternativa</span>
                        <span className="ml-1">Suggerimento</span>
                      </div>
                    </div>
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
                    {/* Certification & level info */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <CertificationBadge certification={certification} />
                      {level && (
                        <Badge variant="outline" className="gap-1">
                          <GraduationCap className="size-3" />
                          Livello {level}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/30 text-sm leading-relaxed whitespace-pre-wrap">
                      {correction.correctedText || 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Tab: Errors ─── */}
              <TabsContent value="errors">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-500" />
                      Errori Trovati
                    </CardTitle>
                    <CardDescription>
                      Clicca su ogni errore per vedere la regola grammaticale completa e gli esempi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {errors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="size-10 mx-auto mb-2 opacity-30" />
                        <p className="font-medium">Nessun errore trovato!</p>
                        <p className="text-sm mt-1">Ottimo lavoro, il tuo testo è grammaticalmente corretto.</p>
                      </div>
                    ) : (
                      <>
                        {/* Error type summary */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(() => {
                            const typeCounts: Partial<Record<ErrorType, number>> = {}
                            for (const e of errors) {
                              typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
                            }
                            return (Object.entries(typeCounts) as [ErrorType, number][]).map(([type, count]) => {
                              const cfg = ERROR_TYPE_CONFIG[type]
                              return (
                                <Badge key={type} variant="outline" className={cfg.badgeClass}>
                                  {cfg.label} ({count})
                                </Badge>
                              )
                            })
                          })()}
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                          {errors.map((error, i) => (
                            <ErrorCard key={error.id} error={error} index={i} />
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Tab: Strengths & Suggestions ─── */}
              <TabsContent value="strengths">
                <div className="space-y-4">

                  {/* ── Strengths section ── */}
                  {strengths.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="size-4 text-amber-500" />
                          Punti Forti
                        </CardTitle>
                        <CardDescription>
                          Aspetti positivi del tuo testo identificati dall&apos;esaminatore AI.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {strengths.map((strength, i) => (
                            <StrengthCard key={i} strength={strength} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Connectors section ── */}
                  {correction.suggestions?.connectors && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Link2 className="size-4 text-emerald-500" />
                          Connettivi
                        </CardTitle>
                        <CardDescription>
                          Connettivi utilizzati e suggeriti per migliorare la coesione del testo.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Used connectors */}
                        {correction.suggestions.connectors.used.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                              Connettivi utilizzati
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {correction.suggestions.connectors.used.map((c, i) => (
                                <Badge
                                  key={i}
                                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                >
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended connectors */}
                        {correction.suggestions.connectors.recommended.length > 0 && (
                          <div>
                            {correction.suggestions.connectors.used.length > 0 && (
                              <Separator className="mb-4" />
                            )}
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                              <Lightbulb className="size-3.5 text-amber-500" />
                              Connettivi consigliati
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {correction.suggestions.connectors.recommended.map((c, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                                >
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {correction.suggestions.connectors.used.length === 0 &&
                          correction.suggestions.connectors.recommended.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Nessun suggerimento sui connettivi disponibile.
                            </p>
                          )}
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Synonyms section ── */}
                  {correction.suggestions?.synonyms &&
                    correction.suggestions.synonyms.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Repeat className="size-4 text-amber-500" />
                            Sinonimi Suggeriti
                          </CardTitle>
                          <CardDescription>
                            Parole ripetute nel tuo testo con alternative consigliate.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {correction.suggestions.synonyms.map((syn, i) => (
                              <div
                                key={i}
                                className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/30"
                              >
                                <Badge
                                  variant="outline"
                                  className="text-sm font-medium border-amber-300 dark:border-amber-700"
                                >
                                  {syn.word}
                                </Badge>
                                {syn.count > 1 && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    ×{syn.count}
                                  </Badge>
                                )}
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
                        </CardContent>
                      </Card>
                    )}

                  {/* ── Study Topics section ── */}
                  {correction.studyTopics && correction.studyTopics.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <ListChecks className="size-4 text-purple-500" />
                          Argomenti da Ripassare
                        </CardTitle>
                        <CardDescription>
                          Temi grammaticali e testuali da approfondire per migliorare.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {correction.studyTopics.map((topic, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2.5 text-sm p-2 rounded-md bg-purple-500/5 dark:bg-purple-500/10"
                            >
                              <BookMarked className="size-4 text-purple-500 shrink-0" />
                              <span>{topic}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Final Note ── */}
                  {correction.finalNote && (
                    <Card className="border-emerald-200/50 dark:border-emerald-800/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
                            <Heart className="size-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              Nota dell&apos;esaminatore
                            </h4>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {correction.finalNote}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Empty state */}
                  {strengths.length === 0 &&
                    !correction.suggestions?.connectors &&
                    (!correction.suggestions?.synonyms || correction.suggestions.synonyms.length === 0) &&
                    (!correction.studyTopics || correction.studyTopics.length === 0) &&
                    !correction.finalNote && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="size-10 mx-auto mb-2 opacity-30" />
                            <p>Nessun suggerimento disponibile per questo tema.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </FadeIn>
        </>
      )}
    </div>
  )
}
