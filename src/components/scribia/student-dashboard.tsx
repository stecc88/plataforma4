'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  CheckCircle2,
  BarChart3,
  Clock,
  Plus,
  Star,
  TrendingUp,
  PenLine,
  Sparkles,
} from 'lucide-react'

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
}

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

/* ─── Stat Card ──────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType
  value: number | string
  label: string
  iconBg: string
  iconColor: string
  delay?: number
}

function StatCard({ icon: Icon, value, label, iconBg, iconColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div variants={itemVariants} custom={delay}>
      <motion.div whileHover={cardHover}>
        <Card className="overflow-hidden">
          <div className={`h-1 ${iconBg.replace('/10', '')}`} />
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`size-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

/* ─── Essay Row ──────────────────────────────────────────────── */

function EssayRow({
  essay,
  onClick,
}: {
  essay: {
    id: string
    title: string
    status: string
    aiScore: number | null
    createdAt: string
  }
  onClick: () => void
}) {
  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
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
  )
}

/* ─── Student Dashboard ──────────────────────────────────────── */

export function StudentDashboard() {
  const { user, stats, essays, setCurrentView, setCurrentEssay } = useAppStore()

  const totalEssays = stats?.totalEssays ?? essays.length
  const correctedEssays = stats?.correctedEssays ?? essays.filter((e) => e.status === 'CORRECTED').length
  const averageScore = stats?.averageScore ?? 0
  const draftEssays = stats?.draftEssays ?? essays.filter((e) => e.status === 'DRAFT').length
  const latestScore = stats?.latestScore ?? null

  // Recent essays (last 8)
  const recentEssays = essays.slice(0, 8)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Bentornato, {user?.name?.split(' ')[0] || 'Studente'}!
          </h2>
          <p className="text-muted-foreground">Ecco un riepilogo dei tuoi saggi.</p>
        </div>
        <Button
          onClick={() => setCurrentView('essay-editor')}
          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all"
          size="lg"
        >
          <Plus className="size-4 mr-1.5" /> Nuovo Saggio
        </Button>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          value={totalEssays}
          label="Saggi Totali"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={CheckCircle2}
          value={correctedEssays}
          label="Corretti"
          iconBg="bg-teal-500/10"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <StatCard
          icon={BarChart3}
          value={averageScore > 0 ? averageScore : '—'}
          label="Punteggio Medio"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={Clock}
          value={draftEssays}
          label="Bozze"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ─── Latest Score Highlight ─── */}
      {latestScore !== null && latestScore !== undefined && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800/40">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <Star className="size-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Ultimo Punteggio</h3>
                    <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${
                      latestScore >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : latestScore >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {latestScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-muted-foreground">
                    {latestScore >= 70
                      ? 'Ottimo lavoro!'
                      : latestScore >= 40
                      ? 'Buon progresso!'
                      : 'Continua a esercitarti!'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scrivi un altro saggio per migliorare
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Recent Essays ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Saggi Recenti
                </CardTitle>
                <CardDescription className="mt-1">
                  {essays.length === 0
                    ? 'Non hai ancora scritto nessun saggio'
                    : `${essays.length} saggi · ${correctedEssays} corretti`}
                </CardDescription>
              </div>
              {essays.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('essay-editor')}
                  className="text-emerald-600 dark:text-emerald-400"
                >
                  Vedi tutti
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {essays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <FileText className="size-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-1">Nessun saggio ancora</p>
                  <p className="text-sm mb-4">Inizia a scrivere il tuo primo saggio in italiano!</p>
                  <Button
                    onClick={() => setCurrentView('essay-editor')}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                  >
                    <Plus className="size-4 mr-1.5" /> Scrivi il primo saggio
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                {recentEssays.map((essay) => (
                  <EssayRow
                    key={essay.id}
                    essay={essay}
                    onClick={() => {
                      setCurrentEssay(essay)
                      setCurrentView('essay-detail')
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Quick Actions ─── */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => setCurrentView('essay-editor')}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <PenLine className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Scrivi un nuovo saggio</p>
                    <p className="text-xs text-muted-foreground">Esercitati con la scrittura in italiano</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={() => setCurrentView('profile')}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <BarChart3 className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Visualizza i tuoi progressi</p>
                    <p className="text-xs text-muted-foreground">Statistica e suggerimenti personalizzati</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
