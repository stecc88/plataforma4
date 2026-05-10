'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type EssayItem } from '@/store/app-store'
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
  User,
  Mail,
  Calendar,
  KeyRound,
  FileText,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Link2,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  Clock,
  PenLine,
  Star,
  Award,
} from 'lucide-react'

/* ─── Animation Variants ──────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

/* ─── Correction Data Types ────────────────────────────────────── */

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

interface AiCorrection {
  errors?: CorrectionError[]
  suggestions?: CorrectionSuggestions
  studyTopics?: string[]
  grammarNotes?: string[]
  vocabularyNotes?: string[]
  styleNotes?: string[]
  correctedText?: string
  score?: number
}

/* ─── Helper: Safely parse aiCorrection ───────────────────────── */

function parseCorrection(raw: Record<string, unknown> | null): AiCorrection | null {
  if (!raw) return null
  try {
    return raw as unknown as AiCorrection
  } catch {
    return null
  }
}

/* ─── Aggregated Data Computation ─────────────────────────────── */

interface ConnectorFreq {
  connector: string
  count: number
}

interface SynonymGroup {
  word: string
  alternatives: string[]
  count: number
}

interface ErrorTypeFreq {
  type: string
  count: number
  percentage: number
}

function aggregateCorrectionData(essays: EssayItem[]) {
  const correctedEssays = essays.filter(
    (e) => e.status === 'CORRECTED' && e.aiCorrection !== null
  )

  // Connector frequency
  const connectorMap = new Map<string, number>()
  // Synonym aggregation
  const synonymMap = new Map<string, { alternatives: Set<string>; count: number }>()
  // Error type frequency
  const errorTypeMap = new Map<string, number>()

  for (const essay of correctedEssays) {
    const correction = parseCorrection(essay.aiCorrection)
    if (!correction) continue

    // Connectors
    const connectors = correction.suggestions?.connectors || []
    for (const conn of connectors) {
      if (typeof conn === 'string' && conn.trim()) {
        const key = conn.trim()
        connectorMap.set(key, (connectorMap.get(key) || 0) + 1)
      }
    }

    // Synonyms
    const synonyms = correction.suggestions?.synonyms || []
    for (const syn of synonyms) {
      if (syn.word && syn.alternatives?.length) {
        const key = syn.word.toLowerCase().trim()
        const existing = synonymMap.get(key)
        if (existing) {
          syn.alternatives.forEach((a) => existing.alternatives.add(a))
          existing.count += 1
        } else {
          synonymMap.set(key, {
            alternatives: new Set(syn.alternatives),
            count: 1,
          })
        }
      }
    }

    // Error types
    const errors = correction.errors || []
    for (const err of errors) {
      if (err.type) {
        const key = err.type.trim()
        errorTypeMap.set(key, (errorTypeMap.get(key) || 0) + 1)
      }
    }
  }

  // Sort and format connectors
  const connectorFreqs: ConnectorFreq[] = Array.from(connectorMap.entries())
    .map(([connector, count]) => ({ connector, count }))
    .sort((a, b) => b.count - a.count)

  // Sort and format synonyms (only words appearing multiple times or with alternatives)
  const synonymGroups: SynonymGroup[] = Array.from(synonymMap.entries())
    .map(([word, data]) => ({
      word,
      alternatives: Array.from(data.alternatives),
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)

  // Sort and format error types with percentage
  const totalErrors = Array.from(errorTypeMap.values()).reduce((s, c) => s + c, 0)
  const errorTypeFreqs: ErrorTypeFreq[] = Array.from(errorTypeMap.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    correctedEssays,
    connectorFreqs,
    synonymGroups,
    errorTypeFreqs,
    totalErrors,
  }
}

/* ─── Error Type Label Mapping (Italian) ──────────────────────── */

function getErrorTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    grammar: 'Grammatica',
    grammatica: 'Grammatica',
    spelling: 'Ortografia',
    ortografia: 'Ortografia',
    punctuation: 'Punteggiatura',
    punteggiatura: 'Punteggiatura',
    syntax: 'Sintassi',
    sintassi: 'Sintassi',
    vocabulary: 'Vocabolario',
    vocabolario: 'Vocabolario',
    style: 'Stile',
    stile: 'Stile',
    agreement: 'Concordamento',
    concordamento: 'Concordamento',
    tense: 'Tempi verbali',
    'tempi verbali': 'Tempi verbali',
    preposition: 'Preposizioni',
    preposizioni: 'Preposizioni',
    article: 'Articoli',
    articoli: 'Articoli',
    conjugation: 'Coniugazione',
    coniugazione: 'Coniugazione',
    word_order: "Ordine delle parole",
    'ordine delle parole': "Ordine delle parole",
    register: 'Registro',
    registro: 'Registro',
    coherence: 'Coerenza',
    coerenza: 'Coerenza',
    cohesion: 'Coesione',
    coesione: 'Coesione',
  }
  const lower = type.toLowerCase().trim()
  return labels[lower] || type.charAt(0).toUpperCase() + type.slice(1)
}

/* ─── Score Color Helper ──────────────────────────────────────── */

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
  if (score >= 60) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
  return 'bg-red-500/10 text-red-700 dark:text-red-400'
}

function getTrendIcon(scores: number[]) {
  if (scores.length < 2) return <Minus className="size-4 text-muted-foreground" />
  const last = scores[scores.length - 1]
  const prev = scores[scores.length - 2]
  if (last > prev) return <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
  if (last < prev) return <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
  return <Minus className="size-4 text-amber-600 dark:text-amber-400" />
}

/* ─── Sub-Components ──────────────────────────────────────────── */

function StudentInfoCard() {
  const { user } = useAppStore()

  if (!user) return null

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-3xl font-bold shadow-lg shadow-emerald-500/20">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold">{user.name}</h3>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge
                  className={
                    user.role === 'STUDENT'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : user.role === 'TEACHER'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                      : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20'
                  }
                >
                  {user.role === 'STUDENT'
                    ? '✍️ Studente'
                    : user.role === 'TEACHER'
                    ? '📚 Insegnante'
                    : '👑 Amministratore'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Membro dal</span>
              <span className="font-medium ml-auto">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('it-IT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
            {user.teacherCode && (
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-muted-foreground">Codice Docente</span>
                <Badge
                  variant="outline"
                  className="ml-auto font-mono text-xs border-amber-500/30 text-amber-700 dark:text-amber-400"
                >
                  {user.teacherCode}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProgressStatistics() {
  const { stats, essays } = useAppStore()

  const correctedCount = stats?.correctedEssays ?? essays.filter((e) => e.status === 'CORRECTED').length
  const totalCount = stats?.totalEssays ?? essays.length
  const draftCount = stats?.draftEssays ?? essays.filter((e) => e.status === 'DRAFT').length
  const submittedCount = stats?.submittedEssays ?? essays.filter((e) => e.status === 'SUBMITTED').length
  const avgScore = stats?.averageScore ?? 0
  const latestScore = stats?.latestScore ?? null

  // Calculate corrected percentage for progress
  const correctedPercentage = totalCount > 0 ? Math.round((correctedCount / totalCount) * 100) : 0

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
            Statistiche di Progresso
          </CardTitle>
          <CardDescription>
            Panoramica delle tue prestazioni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stat rows with Progress bars */}
          <div className="space-y-4">
            {/* Total Essays */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">Temi Totali</span>
                </div>
                <span className="font-bold text-lg">{totalCount}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            {/* Corrected */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-medium">Corretti</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{correctedCount}</span>
                  <span className="text-xs text-muted-foreground">({correctedPercentage}%)</span>
                </div>
              </div>
              <Progress value={correctedPercentage} className="h-2" />
            </div>

            {/* Submitted */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium">Inviati</span>
                </div>
                <span className="font-bold text-lg">{submittedCount}</span>
              </div>
              <Progress
                value={totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0}
                className="h-2"
              />
            </div>

            {/* Drafts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <PenLine className="size-4 text-muted-foreground" />
                  <span className="font-medium">Bozze</span>
                </div>
                <span className="font-bold text-lg">{draftCount}</span>
              </div>
              <Progress
                value={totalCount > 0 ? Math.round((draftCount / totalCount) * 100) : 0}
                className="h-2"
              />
            </div>
          </div>

          <Separator />

          {/* Score indicators */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average Score */}
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-muted-foreground font-medium">Punteggio Medio</span>
              </div>
              <p className={`text-3xl font-bold ${avgScore > 0 ? getScoreColor(avgScore) : 'text-muted-foreground'}`}>
                {avgScore > 0 ? avgScore : '—'}
              </p>
              {avgScore > 0 && (
                <Progress value={avgScore} className="h-1.5 mt-2" />
              )}
            </div>

            {/* Latest Score */}
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-muted-foreground font-medium">Ultimo Punteggio</span>
              </div>
              <p className={`text-3xl font-bold ${latestScore !== null && latestScore !== undefined ? getScoreColor(latestScore) : 'text-muted-foreground'}`}>
                {latestScore !== null && latestScore !== undefined ? latestScore : '—'}
              </p>
              {latestScore !== null && latestScore !== undefined && (
                <Progress value={latestScore} className="h-1.5 mt-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ImprovementSuggestions() {
  const { essays } = useAppStore()

  const data = useMemo(() => aggregateCorrectionData(essays), [essays])

  const hasSuggestions =
    data.connectorFreqs.length > 0 ||
    data.synonymGroups.length > 0 ||
    data.errorTypeFreqs.length > 0

  if (data.correctedEssays.length === 0) {
    return (
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
              Suggerimenti di Miglioramento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Non hai ancora saggi corretti.</p>
              <p className="text-sm mt-1">Scrivi il tuo primo saggio!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!hasSuggestions) {
    return (
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
              Suggerimenti di Miglioramento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Continua a scrivere per ricevere suggerimenti personalizzati!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
            Suggerimenti di Miglioramento
          </CardTitle>
          <CardDescription>
            Analisi basata su {data.correctedEssays.length} saggio{data.correctedEssays.length !== 1 ? 'i' : ''} corretto{data.correctedEssays.length !== 1 ? 'i' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connettori raccomandati */}
          {data.connectorFreqs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="size-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-sm font-semibold">Connettori raccomandati</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.connectorFreqs.slice(0, 12).map((item) => (
                  <Badge
                    key={item.connector}
                    className="bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 transition-colors"
                  >
                    {item.connector}
                    {item.count > 1 && (
                      <span className="ml-1.5 text-[10px] opacity-60">×{item.count}</span>
                    )}
                  </Badge>
                ))}
              </div>
              {data.connectorFreqs.length > 12 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{data.connectorFreqs.length - 12} altri connettori
                </p>
              )}
            </div>
          )}

          {/* Sinonimi per parole ripetute */}
          {data.synonymGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold">Sinonimi per parole ripetute</h4>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {data.synonymGroups.slice(0, 10).map((item) => (
                  <div
                    key={item.word}
                    className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 p-3 rounded-lg bg-muted/30 border"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-sm">{item.word}</span>
                      {item.count > 1 && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400">
                          ×{item.count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <ChevronRight className="size-3 text-muted-foreground hidden sm:block" />
                      {item.alternatives.slice(0, 5).map((alt) => (
                        <Badge
                          key={alt}
                          variant="secondary"
                          className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        >
                          {alt}
                        </Badge>
                      ))}
                      {item.alternatives.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.alternatives.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aree deboli identificate */}
          {data.errorTypeFreqs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-semibold">Aree deboli identificate</h4>
              </div>
              <div className="space-y-3">
                {data.errorTypeFreqs.slice(0, 6).map((item, index) => {
                  // Color coding: most frequent = more concerning
                  const intensity =
                    index === 0
                      ? 'text-red-600 dark:text-red-400'
                      : index === 1
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-teal-600 dark:text-teal-400'

                  return (
                    <div key={item.type} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${intensity}`}>
                          {getErrorTypeLabel(item.type)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {item.count} errore{item.count !== 1 ? 'i' : ''}
                          </span>
                          <span className="text-xs font-bold">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress
                          value={item.percentage}
                          className="h-2"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              {data.totalErrors > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Totale errori analizzati: {data.totalErrors}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function EssayHistory() {
  const { essays, setCurrentEssay, setCurrentView } = useAppStore()

  const sortedEssays = useMemo(
    () =>
      [...essays].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [essays]
  )

  // Score trend: corrected essays sorted by creation date (oldest first for left-to-right trend)
  const scoreTrend = useMemo(() => {
    const corrected = essays
      .filter((e) => e.status === 'CORRECTED' && e.aiScore !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((e) => ({ date: e.createdAt, score: e.aiScore! }))
    return corrected
  }, [essays])

  const scores = scoreTrend.map((s) => s.score)

  if (essays.length === 0) {
    return (
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
              Storico Saggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessun saggio ancora.</p>
              <p className="text-sm mt-1">Inizia a scrivere il tuo primo saggio!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
            Storico Saggi
          </CardTitle>
          {scoreTrend.length > 0 && (
            <CardDescription className="flex items-center gap-2">
              <span>Andamento punteggi</span>
              {getTrendIcon(scores)}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Score Trend Visualization */}
          {scoreTrend.length >= 2 && (
            <div className="mb-5">
              <div className="flex items-end gap-1 h-16 px-1">
                {scoreTrend.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        item.score >= 80
                          ? 'bg-emerald-500'
                          : item.score >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        height: `${Math.max(8, (item.score / 100) * 56)}px`,
                      }}
                      title={`${new Date(item.date).toLocaleDateString('it-IT')}: ${item.score}/100`}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Più vecchio</span>
                <span>Più recente</span>
              </div>
            </div>
          )}

          {/* Single score indicator */}
          {scoreTrend.length === 1 && (
            <div className="mb-5 flex items-center justify-center gap-3 py-3 rounded-lg bg-muted/30 border">
              <span className="text-sm text-muted-foreground">Punteggio:</span>
              <span className={`text-2xl font-bold ${getScoreColor(scoreTrend[0].score)}`}>
                {scoreTrend[0].score}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          )}

          <Separator className="mb-4" />

          {/* Essay list */}
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {sortedEssays.map((essay) => {
              const statusConfig = {
                DRAFT: {
                  label: 'Bozza',
                  icon: PenLine,
                  color: 'bg-muted text-muted-foreground',
                },
                SUBMITTED: {
                  label: 'Inviato',
                  icon: Clock,
                  color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                },
                CORRECTED: {
                  label: 'Corretto',
                  icon: CheckCircle2,
                  color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                },
              }[essay.status] || {
                label: essay.status,
                icon: FileText,
                color: 'bg-muted text-muted-foreground',
              }
              const StatusIcon = statusConfig.icon

              return (
                <button
                  key={essay.id}
                  onClick={() => {
                    setCurrentEssay(essay)
                    setCurrentView('essay-detail')
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-md ${statusConfig.color}`}
                  >
                    <StatusIcon className="size-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {essay.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(essay.createdAt).toLocaleDateString('it-IT', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] ${statusConfig.color}`}>
                      {statusConfig.label}
                    </Badge>
                    {essay.aiScore !== null && (
                      <Badge className={`text-[10px] ${getScoreBg(essay.aiScore)}`}>
                        <Star className="size-2.5 mr-0.5" />
                        {essay.aiScore}
                      </Badge>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Main Component ──────────────────────────────────────────── */

export function ProfileSection() {
  const { user } = useAppStore()

  if (!user) return null

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page title */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold">Profilo</h2>
        <p className="text-muted-foreground text-sm">
          Le tue informazioni e i progressi di apprendimento
        </p>
      </motion.div>

      {/* Responsive grid: 1 col mobile, 2 cols desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <StudentInfoCard />
          <ProgressStatistics />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <ImprovementSuggestions />
        </div>
      </div>

      {/* Full width essay history */}
      <EssayHistory />
    </motion.div>
  )
}
