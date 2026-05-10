'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import type { CorrectionError as CorrectionErrorBase } from '@/lib/ai-correction.types'

/* ─── Types ──────────────────────────────────────────────────── */

interface EssayData {
  id: string
  status: string
  aiScore: number | null
  createdAt: string
  title?: string
  content?: string
  aiCorrection?: Record<string, unknown> | null
}

interface StatsData {
  totalEssays?: number
  correctedEssays?: number
  draftEssays?: number
  submittedEssays?: number
  averageScore?: number
  latestScore?: number | null
  totalStudents?: number
  totalTeachers?: number
}

type CorrectionError = Pick<CorrectionErrorBase, 'type' | 'original' | 'correction'> & {
  explanation?: string
}

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const

/* ─── Constants ──────────────────────────────────────────────── */

const MONTH_LABELS: Record<string, string> = {
  '1': 'Gen', '2': 'Feb', '3': 'Mar', '4': 'Apr',
  '5': 'Mag', '6': 'Giu', '7': 'Lug', '8': 'Ago',
  '9': 'Set', '10': 'Ott', '11': 'Nov', '12': 'Dic',
}

const ERROR_TYPE_LABELS: Record<string, string> = {
  grammar: 'Grammatica',
  spelling: 'Ortografia',
  punctuation: 'Punteggiatura',
  syntax: 'Sintassi',
  vocabulary: 'Vocabolario',
  style: 'Stile',
}

const ERROR_COLORS: Record<string, string> = {
  grammar: '#ef4444',
  spelling: '#f97316',
  punctuation: '#f59e0b',
  vocabulary: '#10b981',
  syntax: '#14b8a6',
  style: '#06b6d4',
}

/* ─── 1. Line Chart — Progresso Temporale ───────────────────── */

const lineChartConfig: ChartConfig = {
  score: {
    label: 'Punteggio',
    color: '#10b981',
  },
}

function ScoreProgressChart({ data }: { data: Array<{ month: string; score: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nessun dato disponibile
      </div>
    )
  }

  return (
    <ChartContainer config={lineChartConfig} className="h-[250px] w-full">
      <LineChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-score)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: 'var(--color-score)', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
        />
      </LineChart>
    </ChartContainer>
  )
}

/* ─── 2. Bar Chart — Punteggi per Categoria ─────────────────── */

function CategoryScoresChart({ data }: { data: Array<{ category: string; punteggio: number; fill: string }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nessun dato disponibile
      </div>
    )
  }

  const barChartConfig: ChartConfig = {
    punteggio: {
      label: 'Punteggio',
    },
    ...Object.fromEntries(
      data.map((item, i) => [
        item.category,
        { label: item.category, color: item.fill },
      ])
    ),
  }

  return (
    <ChartContainer config={barChartConfig} className="h-[250px] w-full">
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="punteggio"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/* ─── 3. Pie Chart — Distribuzione Errori ───────────────────── */

function ErrorDistributionChart({ data }: { data: Array<{ type: string; count: number; fill: string }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nessun errore rilevato
      </div>
    )
  }

  const pieChartConfig: ChartConfig = {
    count: {
      label: 'Errori',
    },
    ...Object.fromEntries(
      data.map((item) => [
        item.type,
        { label: ERROR_TYPE_LABELS[item.type] || item.type, color: item.fill },
      ])
    ),
  }

  return (
    <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="type" hideLabel />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#fff"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="type" />}
        />
      </PieChart>
    </ChartContainer>
  )
}

/* ─── Main StatsCharts Component ────────────────────────────── */

export function StatsCharts({ essays, stats }: { essays: EssayData[]; stats: StatsData | null }) {
  const correctedEssays = essays.filter((e) => e.status === 'CORRECTED')

  const scores = correctedEssays
    .map((e) => e.aiScore)
    .filter((s): s is number => s !== null)

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : stats?.averageScore ?? 0

  // ─── Line Chart Data: Score Progress over Time ────────────

  const lineData = useMemo(() => {
    if (correctedEssays.length === 0) return []

    // Group corrected essays by month
    const monthMap: Record<string, { total: number; count: number }> = {}

    for (const essay of correctedEssays) {
      if (essay.aiScore === null) continue
      const date = new Date(essay.createdAt)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      if (!monthMap[key]) monthMap[key] = { total: 0, count: 0 }
      monthMap[key].total += essay.aiScore
      monthMap[key].count += 1
    }

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { total, count }]) => {
        // Extract month number from key (format: "2024-3")
        const monthNum = key.split('-')[1]
        return {
          month: MONTH_LABELS[monthNum] || monthNum,
          score: Math.round(total / count),
        }
      })
  }, [correctedEssays])

  // ─── Bar Chart Data: Category Scores ──────────────────────

  const barData = useMemo(() => {
    if (correctedEssays.length === 0) return []

    // Aggregate notes from corrections as "weakness areas"
    const areas: Record<string, { count: number; label: string }> = {
      grammar: { count: 0, label: 'Grammatica' },
      vocabulary: { count: 0, label: 'Vocabolario' },
      style: { count: 0, label: 'Stile' },
      punctuation: { count: 0, label: 'Punteggiatura' },
      syntax: { count: 0, label: 'Sintassi' },
      spelling: { count: 0, label: 'Ortografia' },
    }

    for (const essay of correctedEssays) {
      const correction = essay.aiCorrection as Record<string, unknown> | null
      if (!correction) continue

      const errors = correction.errors as CorrectionError[] | undefined
      if (errors && Array.isArray(errors)) {
        for (const error of errors) {
          const t = error.type || 'grammar'
          if (areas[t]) areas[t].count += 1
        }
      }
    }

    // Calculate inverse scores: fewer errors = higher score
    const totalErrors = Object.values(areas).reduce((sum, a) => sum + a.count, 0)
    if (totalErrors === 0) {
      // If no errors, show average score for each area
      return [
        { category: 'Grammatica', punteggio: avgScore || 75, fill: '#10b981' },
        { category: 'Vocabolario', punteggio: avgScore || 70, fill: '#14b8a6' },
        { category: 'Stile', punteggio: avgScore || 80, fill: '#f59e0b' },
        { category: 'Sintassi', punteggio: avgScore || 65, fill: '#f97316' },
        { category: 'Ortografia', punteggio: avgScore || 85, fill: '#06b6d4' },
      ]
    }

    const maxCount = Math.max(...Object.values(areas).map((a) => a.count), 1)

    const categoryColors: Record<string, string> = {
      Grammatica: '#ef4444',
      Vocabolario: '#10b981',
      Stile: '#06b6d4',
      Punteggiatura: '#f59e0b',
      Sintassi: '#f97316',
      Ortografia: '#14b8a6',
    }

    return Object.entries(areas)
      .filter(([, a]) => a.count > 0)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([key, a]) => ({
        category: a.label,
        punteggio: Math.round(Math.max(0, 100 - (a.count / maxCount) * 50)),
        fill: categoryColors[a.label] || '#10b981',
      }))
  }, [correctedEssays, avgScore])

  // ─── Pie Chart Data: Error Distribution ───────────────────

  const pieData = useMemo(() => {
    if (correctedEssays.length === 0) return []

    const errorCounts: Record<string, number> = {}

    for (const essay of correctedEssays) {
      const correction = essay.aiCorrection as Record<string, unknown> | null
      if (!correction) continue

      const errors = correction.errors as CorrectionError[] | undefined
      if (errors && Array.isArray(errors)) {
        for (const error of errors) {
          const t = error.type || 'other'
          errorCounts[t] = (errorCounts[t] || 0) + 1
        }
      }
    }

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        fill: ERROR_COLORS[type] || '#94a3b8',
      }))
  }, [correctedEssays])

  // ─── Quick Stats ──────────────────────────────────────────

  const totalEssays = stats?.totalEssays ?? essays.length
  const correctedCount = stats?.correctedEssays ?? correctedEssays.length
  const draftCount = stats?.draftEssays ?? essays.filter((e) => e.status === 'DRAFT').length
  const submittedCount = stats?.submittedEssays ?? essays.filter((e) => e.status === 'SUBMITTED').length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Quick Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800/30">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {totalEssays}
          </p>
          <p className="text-xs text-muted-foreground">Saggi totali</p>
        </div>
        <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-200 dark:border-teal-800/30">
          <p className="text-2xl font-bold text-teal-700 dark:text-teal-400">
            {correctedCount}
          </p>
          <p className="text-xs text-muted-foreground">Corretti</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-200 dark:border-amber-800/30">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {avgScore}
          </p>
          <p className="text-xs text-muted-foreground">Punteggio medio</p>
        </div>
        <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-200 dark:border-orange-800/30">
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {draftCount + submittedCount}
          </p>
          <p className="text-xs text-muted-foreground">In corso</p>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart — Progresso Temporale */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                Progresso Temporale
              </CardTitle>
              <CardDescription>
                Andamento dei punteggi medi nel tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreProgressChart data={lineData} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Bar Chart — Punteggi per Categoria */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden h-full">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-amber-600 dark:text-amber-400" />
                Punteggi per Categoria
              </CardTitle>
              <CardDescription>
                Performance per area linguistica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryScoresChart data={barData} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart — Distribuzione Errori */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden h-full">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChartIcon className="size-4 text-teal-600 dark:text-teal-400" />
                Distribuzione Errori
              </CardTitle>
              <CardDescription>
                Tipi di errore più frequenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorDistributionChart data={pieData} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Empty state when no corrected essays */}
      {correctedEssays.length === 0 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/30">
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              <BarChart3 className="size-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-1">
                Nessun dato statistico disponibile
              </p>
              <p className="text-sm">
                I grafici appariranno quando gli studenti avranno saggi corretti.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Essays List */}
      {correctedEssays.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4 text-teal-600 dark:text-teal-400" />
                Ultimi Saggi Corretti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {correctedEssays
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((essay) => (
                    <div
                      key={essay.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {essay.title || 'Saggio senza titolo'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(essay.createdAt).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {essay.aiScore !== null && (
                        <Badge
                          className={`text-xs shrink-0 ${
                            essay.aiScore >= 70
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : essay.aiScore >= 40
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {essay.aiScore}/100
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
