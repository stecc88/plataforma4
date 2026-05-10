'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'
import { apiFetchPublic } from './api-fetch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  LayoutDashboard,
  FileText,
  User,
  Users,
  GraduationCap,
  ClipboardList,
  BookOpen,
  LogOut,
  Menu,
  Sun,
  Moon,
  Feather,
  ChevronRight,
  PenLine,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Star,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Hydration hook ─────────────────────────────────────────── */

const emptySubscribe = () => () => {}

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

/* ─── Theme Toggle ───────────────────────────────────────────── */

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useHydrated()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle tema">
        <Sun className="size-5" />
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle tema"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sun className="size-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="size-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {theme === 'dark' ? 'Modalità chiara' : 'Modalità scura'}
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── Navigation Config ──────────────────────────────────────── */

interface NavItem {
  icon: React.ElementType
  label: string
  view: AppView
  badge?: string
}

function getNavItems(role: string): NavItem[] {
  if (role === 'STUDENT') {
    return [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
      { icon: FileText, label: 'I Miei Temi', view: 'essay-editor' },
      { icon: User, label: 'Profilo', view: 'profile' },
    ]
  }
  if (role === 'TEACHER') {
    return [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
      { icon: GraduationCap, label: 'Studenti', view: 'student-detail' },
      { icon: ClipboardList, label: 'Note', view: 'notes' },
      { icon: BookOpen, label: 'Preparazioni', view: 'class-preparations' },
    ]
  }
  // ADMIN
  return [
    { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
    { icon: Users, label: 'Utenti', view: 'users' },
    { icon: AlertCircle, label: 'In Attesa', view: 'pending-teachers' },
  ]
}

/* ─── Sidebar ────────────────────────────────────────────────── */

function Sidebar() {
  const { user, currentView, setCurrentView } = useAppStore()
  const navItems = getNavItems(user?.role || 'STUDENT')

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md">
          <Feather className="size-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          Scrib<span className="text-emerald-600 dark:text-emerald-400">IA</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Icon className="size-5" />
              {item.label}
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
              {isActive && (
                <ChevronRight className="size-4 ml-auto text-primary" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Role badge */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="mt-2 w-full justify-center text-xs"
        >
          {user?.role === 'ADMIN'
            ? '👑 Amministratore'
            : user?.role === 'TEACHER'
            ? '📚 Insegnante'
            : '✍️ Studente'}
        </Badge>
      </div>
    </aside>
  )
}

/* ─── Mobile Sidebar (Sheet) ─────────────────────────────────── */

function MobileSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, currentView, setCurrentView, logout } = useAppStore()
  const navItems = getNavItems(user?.role || 'STUDENT')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-6 h-16 flex flex-row items-center gap-2.5 border-b">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 shadow-md">
            <Feather className="size-4 text-white" />
          </div>
          <SheetTitle className="text-lg font-bold">
            Scrib<span className="text-emerald-600 dark:text-emerald-400">IA</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view)
                  onOpenChange(false)
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="size-5" />
                {item.label}
                {isActive && <ChevronRight className="size-4 ml-auto text-primary" />}
              </button>
            )
          })}
        </nav>

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-center text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="size-4 mr-2" />
            Esci
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ─── Header ─────────────────────────────────────────────────── */

function Header() {
  const { user, logout } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Current view title */}
        <h1 className="text-lg font-semibold hidden sm:block">
          {user?.role === 'STUDENT' ? 'Studente' : user?.role === 'TEACHER' ? 'Insegnante' : 'Admin'}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <span>{user?.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="size-4 mr-1" />
          <span className="hidden sm:inline">Esci</span>
        </Button>
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  )
}

/* ─── Dashboard: Student ─────────────────────────────────────── */

function StudentDashboard() {
  const { stats, essays, setCurrentView, setCurrentEssay } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Benvenuto!</h2>
          <p className="text-muted-foreground">Ecco un riepilogo dei tuoi temi.</p>
        </div>
        <Button
          onClick={() => setCurrentView('essay-editor')}
          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
        >
          <Plus className="size-4 mr-1" /> Nuovo Tema
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalEssays || 0}</p>
                <p className="text-xs text-muted-foreground">Temi Totali</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CheckCircle2 className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.correctedEssays || 0}</p>
                <p className="text-xs text-muted-foreground">Corretti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10">
                <BarChart3 className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.averageScore || 0}</p>
                <p className="text-xs text-muted-foreground">Punteggio Medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Clock className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.draftEssays || 0}</p>
                <p className="text-xs text-muted-foreground">Bozze</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent essays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Temi Recenti</CardTitle>
          <CardDescription>I tuoi ultimi temi scritti</CardDescription>
        </CardHeader>
        <CardContent>
          {essays.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-30" />
              <p>Nessun tema ancora. Inizia a scrivere!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {essays.slice(0, 10).map((essay) => (
                <button
                  key={essay.id}
                  onClick={() => {
                    setCurrentEssay(essay)
                    setCurrentView('essay-detail')
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-md ${
                      essay.status === 'CORRECTED'
                        ? 'bg-emerald-500/10'
                        : essay.status === 'SUBMITTED'
                        ? 'bg-amber-500/10'
                        : 'bg-muted'
                    }`}
                  >
                    {essay.status === 'CORRECTED' ? (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{essay.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(essay.createdAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  {essay.aiScore !== null && (
                    <Badge
                      variant={essay.aiScore >= 70 ? 'default' : 'secondary'}
                      className={`text-xs ${
                        essay.aiScore >= 70
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {essay.aiScore}/100
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Dashboard: Teacher ─────────────────────────────────────── */

function TeacherDashboard() {
  const { stats, students, essays } = useAppStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Insegnante</h2>
        <p className="text-muted-foreground">Panoramica dei tuoi studenti e dei loro progressi.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalStudents || students.length}</p>
                <p className="text-xs text-muted-foreground">Studenti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <FileText className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalEssays || essays.length}</p>
                <p className="text-xs text-muted-foreground">Temi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10">
                <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.correctedEssays || 0}</p>
                <p className="text-xs text-muted-foreground">Corretti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
                <BarChart3 className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.averageScore || 0}</p>
                <p className="text-xs text-muted-foreground">Punteggio Medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">I Tuoi Studenti</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="size-12 mx-auto mb-3 opacity-30" />
              <p>Nessuno studente iscritto.</p>
              <p className="text-xs mt-1">Condividi il tuo codice insegnante!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Iscritto: {new Date(student.enrolledAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Dashboard: Admin ───────────────────────────────────────── */

function AdminDashboard() {
  const { stats } = useAppStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">Panoramica globale della piattaforma.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-muted-foreground">Studenti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Users className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalTeachers || 0}</p>
                <p className="text-xs text-muted-foreground">Insegnanti</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-500/10">
                <FileText className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalEssays || 0}</p>
                <p className="text-xs text-muted-foreground">Temi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10">
                <BarChart3 className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.averageScore || 0}</p>
                <p className="text-xs text-muted-foreground">Punteggio Medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ─── Placeholder Views ──────────────────────────────────────── */

function EssayEditorView() {
  const { currentEssay } = useAppStore()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {currentEssay ? 'Dettaglio Tema' : 'I Miei Temi'}
      </h2>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <PenLine className="size-12 mx-auto mb-3 opacity-30" />
            <p>Seleziona un tema per visualizzarlo.</p>
            <p className="text-xs mt-1">Le funzionalità complete saranno disponibili presto.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EssayDetailView() {
  const { currentEssay, setCurrentView } = useAppStore()
  if (!currentEssay) {
    setCurrentView('essay-editor')
    return null
  }
  const correction = currentEssay.aiCorrection as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('essay-editor')}>
          <ChevronRight className="size-4 rotate-180 mr-1" /> Indietro
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentEssay.title}</CardTitle>
            <Badge
              className={
                currentEssay.status === 'CORRECTED'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }
            >
              {currentEssay.status}
            </Badge>
          </div>
          <CardDescription>
            {new Date(currentEssay.createdAt).toLocaleDateString('it-IT')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Testo Originale</h4>
            <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
              {currentEssay.content}
            </div>
          </div>
          {correction && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold">Correzione AI</h4>
                  {currentEssay.aiScore !== null && (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <Star className="size-3 mr-1" /> {currentEssay.aiScore}/100
                    </Badge>
                  )}
                </div>
                <div className="p-4 rounded-lg bg-emerald-500/5 text-sm whitespace-pre-wrap">
                  {(correction as Record<string, unknown>).correctedText as string || 'N/A'}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileView() {
  const { user } = useAppStore()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profilo</h2>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xl font-semibold">{user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1">
                {user?.role === 'STUDENT' ? '✍️ Studente' : '📚 Insegnante'}
              </Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Membro dal</p>
              <p className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}</p>
            </div>
            {user?.teacherCode && (
              <div>
                <p className="text-muted-foreground">Codice Insegnante</p>
                <p className="font-medium font-mono">{user.teacherCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotesView() {
  const { notes } = useAppStore()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Note</h2>
      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <ClipboardList className="size-12 mx-auto mb-3 opacity-30" />
            <p>Nessuna nota.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {note.studentName || note.studentId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function PreparationsView() {
  const { preparations } = useAppStore()
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Preparazioni di Classe</h2>
      {preparations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <BookOpen className="size-12 mx-auto mb-3 opacity-30" />
            <p>Nessuna preparazione.</p>
            <p className="text-xs mt-1">Genera una preparazione con AI!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {preparations.map((prep) => (
            <Card key={prep.id}>
              <CardHeader>
                <CardTitle className="text-base">{prep.title}</CardTitle>
                <CardDescription>
                  {new Date(prep.generatedAt).toLocaleDateString('it-IT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {Array.isArray((prep.content as Record<string, unknown>)?.objectives)
                    ? ((prep.content as Record<string, unknown>).objectives as string[]).join(' · ')
                    : 'Preparazione generata da AI'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function UsersView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestione Utenti</h2>
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground py-12">
          <Users className="size-12 mx-auto mb-3 opacity-30" />
          <p>Gestione utenti completa in arrivo.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PendingTeachersView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Insegnanti in Attesa</h2>
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground py-12">
          <AlertCircle className="size-12 mx-auto mb-3 opacity-30" />
          <p>Approvazione insegnanti in arrivo.</p>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Content Router ─────────────────────────────────────────── */

function ContentArea() {
  const { currentView, user } = useAppStore()

  // Student views
  if (user?.role === 'STUDENT') {
    switch (currentView) {
      case 'dashboard':
        return <StudentDashboard />
      case 'essay-editor':
        return <EssayEditorView />
      case 'essay-detail':
        return <EssayDetailView />
      case 'profile':
        return <ProfileView />
      default:
        return <StudentDashboard />
    }
  }

  // Teacher views
  if (user?.role === 'TEACHER') {
    switch (currentView) {
      case 'dashboard':
        return <TeacherDashboard />
      case 'student-detail':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dettaglio Studente</h2>
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground py-12">
                <GraduationCap className="size-12 mx-auto mb-3 opacity-30" />
                <p>Seleziona uno studente per vedere i dettagli.</p>
              </CardContent>
            </Card>
          </div>
        )
      case 'notes':
        return <NotesView />
      case 'class-preparations':
        return <PreparationsView />
      default:
        return <TeacherDashboard />
    }
  }

  // Admin views
  switch (currentView) {
    case 'dashboard':
      return <AdminDashboard />
    case 'users':
      return <UsersView />
    case 'pending-teachers':
      return <PendingTeachersView />
    default:
      return <AdminDashboard />
  }
}

/* ─── AppShell ───────────────────────────────────────────────── */

export function AppShell() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <ContentArea />
        </main>
      </div>
    </div>
  )
}
