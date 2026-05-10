'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore, type AppUser } from '@/store/app-store'
import { apiFetch } from '@/components/scribia/api-fetch'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  ShieldX,
  CheckCircle2,
  Loader2,
  Search,
  UserCheck,
  UserX,
  Shield,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatsCharts } from '@/components/scribia/stats-charts'

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
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

/* ─── Types ──────────────────────────────────────────────────── */

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  teacherCode: string | null
  createdAt: string
}

/* ─── Role Badge ─────────────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'ADMIN':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 gap-1">
          <Shield className="size-3" /> Admin
        </Badge>
      )
    case 'TEACHER':
      return (
        <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 gap-1">
          <GraduationCap className="size-3" /> Docente
        </Badge>
      )
    case 'STUDENT':
    default:
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1">
          <Users className="size-3" /> Studente
        </Badge>
      )
  }
}

/* ─── Status Badge ───────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1">
          <CheckCircle2 className="size-3" /> Attivo
        </Badge>
      )
    case 'PENDING':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 gap-1">
          <Clock className="size-3" /> In attesa
        </Badge>
      )
    case 'SUSPENDED':
      return (
        <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 gap-1">
          <ShieldX className="size-3" /> Sospeso
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

/* ─── Stat Card ──────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType
  value: number | string
  label: string
  iconBg: string
  iconColor: string
  accentColor: string
}

function StatCard({ icon: Icon, value, label, iconBg, iconColor, accentColor }: StatCardProps) {
  return (
    <motion.div variants={itemVariants}>
      <motion.div whileHover={cardHover}>
        <Card className="overflow-hidden">
          <div className={`h-1 ${accentColor}`} />
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

/* ─── Admin Dashboard ────────────────────────────────────────── */

export function AdminDashboard() {
  const { stats, essays, fetchStats } = useAppStore()
  const [activeTab, setActiveTab] = useState('utenti')

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Pending teachers state
  const [pendingTeachers, setPendingTeachers] = useState<AdminUser[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    teacher: AdminUser | null
    action: 'approve' | 'reject' | null
  }>({ open: false, teacher: null, action: null })
  const [confirmActionLoading, setConfirmActionLoading] = useState(false)

  // ─── Fetch Users ─────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      const query = params.toString()
      const url = `/api/admin/users${query ? `?${query}` : ''}`
      const data = await apiFetch<{ users: AdminUser[] }>(url)
      setUsers(data.users || [])
    } catch (err) {
      toast.error('Errore nel caricamento degli utenti')
    } finally {
      setUsersLoading(false)
    }
  }, [roleFilter, statusFilter])

  // ─── Fetch Pending Teachers ──────────────────────────────────

  const fetchPendingTeachers = useCallback(async () => {
    setPendingLoading(true)
    try {
      const data = await apiFetch<{ users: AdminUser[] }>(
        '/api/admin/users?role=TEACHER&status=PENDING'
      )
      setPendingTeachers(data.users || [])
    } catch (err) {
      toast.error('Errore nel caricamento dei docenti in attesa')
    } finally {
      setPendingLoading(false)
    }
  }, [])

  // ─── Load data on mount ──────────────────────────────────────

  useEffect(() => {
    fetchUsers()
    fetchPendingTeachers()
  }, [fetchUsers, fetchPendingTeachers])

  // ─── Refetch users when filters change ───────────────────────

  useEffect(() => {
    if (activeTab === 'utenti') {
      fetchUsers()
    }
  }, [roleFilter, statusFilter, fetchUsers, activeTab])

  // ─── Handle User Actions ─────────────────────────────────────

  const handleSuspendUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      await apiFetch('/api/admin/suspend-user', {
        method: 'POST',
        body: JSON.stringify({ userId, action: 'suspend' }),
      })
      toast.success('Utente sospeso con successo')
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error('Errore nella sospensione dell\'utente')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivateUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      await apiFetch('/api/admin/suspend-user', {
        method: 'POST',
        body: JSON.stringify({ userId, action: 'activate' }),
      })
      toast.success('Utente attivato con successo')
      fetchUsers()
      fetchPendingTeachers()
      fetchStats()
    } catch (err) {
      toast.error('Errore nell\'attivazione dell\'utente')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveTeacher = async (userId: string) => {
    setActionLoading(userId)
    try {
      await apiFetch('/api/admin/approve-teacher', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      toast.success('Docente approvato con successo')
      fetchUsers()
      fetchPendingTeachers()
      fetchStats()
    } catch (err) {
      toast.error('Errore nell\'approvazione del docente')
    } finally {
      setActionLoading(null)
    }
  }

  // ─── Confirm Dialog Actions (Pending Teachers Tab) ───────────

  const openConfirmDialog = (teacher: AdminUser, action: 'approve' | 'reject') => {
    setConfirmDialog({ open: true, teacher, action })
  }

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, teacher: null, action: null })
  }

  const executeConfirmedAction = async () => {
    const { teacher, action } = confirmDialog
    if (!teacher || !action) return

    setConfirmActionLoading(true)
    try {
      if (action === 'approve') {
        await apiFetch('/api/admin/approve-teacher', {
          method: 'POST',
          body: JSON.stringify({ userId: teacher.id }),
        })
        toast.success(`${teacher.name} è stato approvato come docente`)
      } else {
        await apiFetch('/api/admin/suspend-user', {
          method: 'POST',
          body: JSON.stringify({ userId: teacher.id, action: 'suspend' }),
        })
        toast.success(`Richiesta di ${teacher.name} rifiutata`)
      }
      fetchPendingTeachers()
      fetchUsers()
      fetchStats()
    } catch (err) {
      toast.error(
        action === 'approve'
          ? 'Errore nell\'approvazione del docente'
          : 'Errore nel rifiuto del docente'
      )
    } finally {
      setConfirmActionLoading(false)
      closeConfirmDialog()
    }
  }

  // ─── Stats values ────────────────────────────────────────────

  const totalStudents = stats?.totalStudents ?? 0
  const totalTeachers = stats?.totalTeachers ?? 0
  const totalEssays = stats?.totalEssays ?? essays.length
  const averageScore = stats?.averageScore ?? 0

  // ─── Filtered users (client-side additional filtering if needed) ──

  const filteredUsers = users

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">
          Panoramica globale della piattaforma ScribIA.
        </p>
      </motion.div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={GraduationCap}
          value={totalStudents}
          label="Studenti totali"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          accentColor="bg-emerald-500"
        />
        <StatCard
          icon={Users}
          value={totalTeachers}
          label="Docenti"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          accentColor="bg-amber-500"
        />
        <StatCard
          icon={FileText}
          value={totalEssays}
          label="Saggi totali"
          iconBg="bg-teal-500/10"
          iconColor="text-teal-600 dark:text-teal-400"
          accentColor="bg-teal-500"
        />
        <StatCard
          icon={BarChart3}
          value={averageScore > 0 ? averageScore : '—'}
          label="Punteggio medio"
          iconBg="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
          accentColor="bg-orange-500"
        />
      </div>

      {/* ─── Tabs ─── */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="utenti" className="gap-1.5">
              <Users className="size-4" /> Utenti
            </TabsTrigger>
            <TabsTrigger value="docenti-attesa" className="gap-1.5 relative">
              <GraduationCap className="size-4" /> Docenti in Attesa
              {pendingTeachers.length > 0 && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                  {pendingTeachers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="statistiche" className="gap-1.5">
              <BarChart3 className="size-4" /> Statistiche
            </TabsTrigger>
          </TabsList>

          {/* ─── Tab 1: Utenti ─── */}
          <TabsContent value="utenti" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="size-5 text-emerald-600 dark:text-emerald-400" />
                      Gestione Utenti
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {filteredUsers.length} utenti trovati
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Role filter */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="ALL">Tutti i ruoli</option>
                        <option value="STUDENT">Studenti</option>
                        <option value="TEACHER">Docenti</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    {/* Status filter */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="ALL">Tutti gli stati</option>
                        <option value="ACTIVE">Attivo</option>
                        <option value="PENDING">In attesa</option>
                        <option value="SUSPENDED">Sospeso</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mr-2" />
                    Caricamento utenti...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">Nessun utente trovato</p>
                    <p className="text-sm mt-1">
                      Prova a modificare i filtri di ricerca.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead className="hidden md:table-cell">Data registrazione</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-xs font-bold shrink-0">
                                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="truncate max-w-[120px]">{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate max-w-[180px]">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              <RoleBadge role={user.role} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={user.status} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {new Date(user.createdAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Active + not Admin → Suspend */}
                                {user.status === 'ACTIVE' && user.role !== 'ADMIN' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-8 text-xs gap-1"
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleSuspendUser(user.id)}
                                  >
                                    {actionLoading === user.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <ShieldX className="size-3" />
                                    )}
                                    Sospendi
                                  </Button>
                                )}
                                {/* Suspended → Activate */}
                                {user.status === 'SUSPENDED' && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleActivateUser(user.id)}
                                  >
                                    {actionLoading === user.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <UserCheck className="size-3" />
                                    )}
                                    Attiva
                                  </Button>
                                )}
                                {/* Teacher + Pending → Approve */}
                                {user.role === 'TEACHER' && user.status === 'PENDING' && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    disabled={actionLoading === user.id}
                                    onClick={() => handleApproveTeacher(user.id)}
                                  >
                                    {actionLoading === user.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="size-3" />
                                    )}
                                    Approva
                                  </Button>
                                )}
                                {/* Admin users have no actions */}
                                {user.role === 'ADMIN' && (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Tab 2: Docenti in Attesa ─── */}
          <TabsContent value="docenti-attesa" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="size-5 text-amber-600 dark:text-amber-400" />
                  Docenti in Attesa di Approvazione
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Approva o rifiuta le richieste di registrazione dei docenti.
                </p>
              </div>

              {pendingLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Loader2 className="size-6 animate-spin mr-2" />
                      Caricamento docenti in attesa...
                    </div>
                  </CardContent>
                </Card>
              ) : pendingTeachers.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12 text-muted-foreground">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <CheckCircle2 className="size-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-1">
                          Nessun docente in attesa di approvazione
                        </p>
                        <p className="text-sm">
                          Tutte le richieste sono state gestite.
                        </p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTeachers.map((teacher) => (
                    <motion.div
                      key={teacher.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div whileHover={cardHover}>
                        <Card className="overflow-hidden border-amber-200 dark:border-amber-800/40">
                          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 shrink-0">
                                <GraduationCap className="size-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-base truncate">
                                  {teacher.name}
                                </CardTitle>
                                <CardDescription className="truncate">
                                  {teacher.email}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                              <Clock className="size-3.5" />
                              Registrato il{' '}
                              {new Date(teacher.createdAt).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                            <Separator className="mb-4" />
                            <div className="flex items-center gap-2">
                              <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                size="sm"
                                onClick={() => openConfirmDialog(teacher, 'approve')}
                              >
                                <UserCheck className="size-4" />
                                Approva
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 gap-1.5"
                                size="sm"
                                onClick={() => openConfirmDialog(teacher, 'reject')}
                              >
                                <UserX className="size-4" />
                                Rifiuta
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Tab 3: Statistiche ─── */}
          <TabsContent value="statistiche" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="size-5 text-teal-600 dark:text-teal-400" />
                  Statistiche della Piattaforma
                </CardTitle>
                <CardDescription>
                  Analisi dettagliata dei saggi e delle prestazioni.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {essays.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <BarChart3 className="size-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-1">
                        Nessun dato statistico disponibile
                      </p>
                      <p className="text-sm">
                        I dati appariranno quando gli studenti inizieranno a scrivere saggi.
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <StatsCharts essays={essays} stats={stats} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ─── Confirmation Dialog ─── */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'approve' ? (
                <>
                  <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  Approva Docente
                </>
              ) : (
                <>
                  <UserX className="size-5 text-red-600 dark:text-red-400" />
                  Rifiuta Docente
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'approve'
                ? `Sei sicuro di voler approvare ${confirmDialog.teacher?.name} come docente? Verrà generato un codice insegnante e l'account verrà attivato.`
                : `Sei sicuro di voler rifiutare la richiesta di ${confirmDialog.teacher?.name}? L'account verrà sospeso.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {confirmDialog.teacher && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                  <GraduationCap className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{confirmDialog.teacher.name}</p>
                  <p className="text-xs text-muted-foreground">{confirmDialog.teacher.email}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeConfirmDialog}
              disabled={confirmActionLoading}
            >
              Annulla
            </Button>
            <Button
              className={
                confirmDialog.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'
                  : 'bg-red-600 hover:bg-red-700 text-white gap-1.5'
              }
              onClick={executeConfirmedAction}
              disabled={confirmActionLoading}
            >
              {confirmActionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : confirmDialog.action === 'approve' ? (
                <UserCheck className="size-4" />
              ) : (
                <UserX className="size-4" />
              )}
              {confirmDialog.action === 'approve' ? 'Approva' : 'Rifiuta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
