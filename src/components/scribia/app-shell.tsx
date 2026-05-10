'use client'

import { useState, useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type AppView } from '@/store/app-store'
import { EssayEditor } from './essay-editor'
import { EssayDetail } from './essay-detail'
import { StudentDashboard } from './student-dashboard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  CheckCircle2,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { ProfileSection } from './profile-section'

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

/* ─── Dashboard: Student (imported from student-dashboard.tsx) ── */

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
  return <EssayEditor />
}

function EssayDetailView() {
  return <EssayDetail />
}

function ProfileView() {
  return <ProfileSection />
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
