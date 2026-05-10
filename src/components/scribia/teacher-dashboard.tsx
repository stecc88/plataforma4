'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { setSelectedStudent } from './teacher-state'
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
  GraduationCap,
  CheckCircle2,
  BarChart3,
  Clock,
  ClipboardList,
  BookOpen,
  Star,
  TrendingUp,
  Sparkles,
  StickyNote,
  FileText,
} from 'lucide-react'

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

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
} as const

/* ─── Stat Card ──────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType
  value: number | string
  label: string
  iconBg: string
  iconColor: string
  accentBar: string
}

function StatCard({ icon: Icon, value, label, iconBg, iconColor, accentBar }: StatCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <motion.div whileHover={cardHover}>
        <Card className="overflow-hidden">
          <div className={`h-1 ${accentBar}`} />
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

/* ─── Student Row ────────────────────────────────────────────── */

function StudentRow({
  student,
  essayCount,
  correctedCount,
  latestScore,
  lastEssayDate,
  onClick,
}: {
  student: { id: string; name: string; enrolledAt: string }
  essayCount: number
  correctedCount: number
  latestScore: number | null
  lastEssayDate: string | null
  onClick: () => void
}) {
  // Progress: ratio of corrected essays to total
  const progressPct = essayCount > 0 ? Math.round((correctedCount / essayCount) * 100) : 0

  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-accent/50 transition-all text-left group"
      whileHover={{ x: 2 }}
    >
      {/* Avatar initial */}
      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white text-sm font-bold shadow-sm shrink-0">
        {student.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {student.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lastEssayDate ? (
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              Ultimo: {new Date(lastEssayDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </span>
          ) : (
            <span>Nessun saggio</span>
          )}
        </div>
        {/* Mini progress bar */}
        {essayCount > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
              <motion.div
                className={`h-full rounded-full ${
                  progressPct >= 70
                    ? 'bg-emerald-500'
                    : progressPct >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {correctedCount}/{essayCount}
            </span>
          </div>
        )}
      </div>

      {/* Essay count + latest score */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className="text-xs gap-1">
          <FileText className="size-3" /> {essayCount}
        </Badge>
        {latestScore !== null && (
          <Badge
            className={`text-xs gap-1 ${
              latestScore >= 70
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : latestScore >= 40
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
          >
            <Star className="size-3" /> {latestScore}
          </Badge>
        )}
      </div>
    </motion.button>
  )
}

/* ─── Teacher Dashboard ──────────────────────────────────────── */

export function TeacherDashboard() {
  const { user, stats, students, essays, setCurrentView } = useAppStore()

  // Derive stats
  const totalStudents = stats?.totalStudents ?? students.length
  const correctedEssays = stats?.correctedEssays ?? essays.filter((e) => e.status === 'CORRECTED').length
  const averageScore = stats?.averageScore ?? 0
  const pendingEssays = stats?.submittedEssays ?? essays.filter((e) => e.status === 'SUBMITTED').length

  // Compute per-student data
  const studentData = students.map((student) => {
    const studentEssays = essays.filter((e) => e.studentId === student.id)
    const corrected = studentEssays.filter((e) => e.status === 'CORRECTED')
    const latestScore =
      corrected.length > 0
        ? corrected.sort(
            (a, b) =>
              new Date(b.correctedAt || b.createdAt).getTime() -
              new Date(a.correctedAt || a.createdAt).getTime()
          )[0].aiScore
        : null
    const lastEssayDate = studentEssays.length > 0
      ? studentEssays.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0].createdAt
      : null
    return {
      ...student,
      essayCount: studentEssays.length,
      correctedCount: corrected.length,
      latestScore,
      lastEssayDate,
    }
  })

  // Handle student click
  const handleStudentClick = (student: (typeof studentData)[number]) => {
    setSelectedStudent(student.id, student.name, student.email, student.enrolledAt)
    setCurrentView('student-detail')
  }

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
            Bentornato, {user?.name?.split(' ')[0] || 'Insegnante'}!
          </h2>
          <p className="text-muted-foreground">
            Panoramica dei tuoi studenti e dei loro progressi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="size-3 mr-1 text-emerald-500" />
            Codice: {user?.teacherCode || '—'}
          </Badge>
        </div>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          value={totalStudents}
          label="Total Studenti"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accentBar="bg-emerald-500"
        />
        <StatCard
          icon={CheckCircle2}
          value={correctedEssays}
          label="Saggi Corretti"
          iconBg="bg-teal-500/10"
          iconColor="text-teal-600 dark:text-teal-400"
          accentBar="bg-teal-500"
        />
        <StatCard
          icon={BarChart3}
          value={averageScore > 0 ? Math.round(averageScore) : '—'}
          label="Media Punteggi"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          accentBar="bg-amber-500"
        />
        <StatCard
          icon={Clock}
          value={pendingEssays}
          label="Saggi in Attesa"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
          accentBar="bg-orange-500"
        />
      </div>

      {/* ─── Average Score Highlight ─── */}
      {averageScore > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800/40">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="size-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Punteggio Medio Classe</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold ${
                        averageScore >= 70
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : averageScore >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {Math.round(averageScore)}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-muted-foreground">
                    {averageScore >= 70
                      ? 'La classe va bene!'
                      : averageScore >= 40
                      ? 'Progressi nella media.'
                      : 'La classe ha bisogno di supporto.'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {correctedEssays} saggi corretti su {essays.length} totali
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Student List ─── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
                  I Tuoi Studenti
                </CardTitle>
                <CardDescription className="mt-1">
                  {students.length === 0
                    ? 'Nessuno studente iscritto ancora'
                    : `${students.length} studenti · ${correctedEssays} saggi corretti`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <GraduationCap className="size-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-1">Nessuno studente iscritto</p>
                  <p className="text-sm mb-1">
                    Condividi il tuo codice insegnante con i tuoi studenti:
                  </p>
                  <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/40">
                    <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-lg font-bold font-mono tracking-wider text-emerald-700 dark:text-emerald-400">
                      {user?.teacherCode || '—'}
                    </span>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                {studentData.map((student) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    essayCount={student.essayCount}
                    correctedCount={student.correctedCount}
                    latestScore={student.latestScore}
                    lastEssayDate={student.lastEssayDate}
                    onClick={() => handleStudentClick(student)}
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
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
              onClick={() => setCurrentView('notes')}
            >
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <StickyNote className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Aggiungi nota</p>
                    <p className="text-xs text-muted-foreground">
                      Annotazioni e osservazioni sugli studenti
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }}>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
              onClick={() => setCurrentView('class-preparations')}
            >
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10">
                    <BookOpen className="size-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Genera preparazione</p>
                    <p className="text-xs text-muted-foreground">
                      Preparazioni di classe personalizzate con AI
                    </p>
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
