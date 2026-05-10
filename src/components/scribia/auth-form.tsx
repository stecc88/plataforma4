'use client'

import { useState } from 'react'
import { useAppStore, type AppUser } from '@/store/app-store'
import { apiFetchPublic } from './api-fetch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Feather,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Props ──────────────────────────────────────────────────── */

interface AuthFormProps {
  initialTab?: 'login' | 'register'
  onSuccess?: () => void
}

/* ─── Auth Form Component ────────────────────────────────────── */

export function AuthForm({ initialTab = 'login', onSuccess }: AuthFormProps) {
  const { login } = useAppStore()

  // Shared fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Register fields
  const [name, setName] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [teacherCode, setTeacherCode] = useState('')

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function clearErrors() {
    setErrors({})
  }

  function validateLogin(): boolean {
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.email = "L'email è obbligatoria"
    else if (!email.includes('@')) errs.email = 'Email non valida'
    if (!password) errs.password = 'La password è obbligatoria'
    else if (password.length < 6) errs.password = 'Almeno 6 caratteri'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateRegister(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Il nome è obbligatorio'
    else if (name.trim().length < 2) errs.name = 'Almeno 2 caratteri'
    if (!email.trim()) errs.email = "L'email è obbligatoria"
    else if (!email.includes('@')) errs.email = 'Email non valida'
    if (!password) errs.password = 'La password è obbligatoria'
    else if (password.length < 6) errs.password = 'Almeno 6 caratteri'
    if (password !== confirmPassword) errs.confirmPassword = 'Le password non coincidono'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!validateLogin()) return

    setIsLoading(true)
    try {
      const data = await apiFetchPublic<{ user: AppUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      login(data.user, data.token)
      toast.success(`Bentornato, ${data.user?.name || 'utente'}!`)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante il login')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validateRegister()) return

    setIsLoading(true)
    try {
      const data = await apiFetchPublic<{ user: AppUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          role,
          teacherCode: teacherCode.trim() || undefined,
        }),
      })

      if (role === 'TEACHER') {
        toast.info('Registrazione inviata! Il tuo account richiede approvazione dell\'amministratore.', {
          duration: 6000,
        })
      } else {
        toast.success('Registrazione completata! Benvenuto su ScribIA!')
      }

      login(data.user, data.token)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border/60">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-lg">
            <Feather className="size-7 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            ScribIA
          </span>
        </CardTitle>
        <CardDescription>
          Il tuo assistente per la scrittura in italiano
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={initialTab} className="w-full" onValueChange={clearErrors}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="gap-1.5">
              <LogIn className="size-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5">
              <UserPlus className="size-4" />
              Registrati
            </TabsTrigger>
          </TabsList>

          {/* ─── Login Tab ─────────────────────────────────────── */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors() }}
                  placeholder="nome@esempio.com"
                  className={errors.email ? 'border-destructive' : ''}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors() }}
                  placeholder="Almeno 6 caratteri"
                  className={errors.password ? 'border-destructive' : ''}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="size-4 mr-2" />
                )}
                Accedi
              </Button>
            </form>
          </TabsContent>

          {/* ─── Register Tab ──────────────────────────────────── */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome</Label>
                <Input
                  id="reg-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErrors() }}
                  placeholder="Il tuo nome"
                  className={errors.name ? 'border-destructive' : ''}
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors() }}
                  placeholder="nome@esempio.com"
                  className={errors.email ? 'border-destructive' : ''}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors() }}
                  placeholder="Almeno 6 caratteri"
                  className={errors.password ? 'border-destructive' : ''}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Conferma Password</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearErrors() }}
                  placeholder="Ripeti la password"
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ruolo</Label>
                <Select value={role} onValueChange={(v) => { setRole(v as 'STUDENT' | 'TEACHER'); clearErrors() }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">✍️ Studente</SelectItem>
                    <SelectItem value="TEACHER">📚 Docente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student: optional teacher code */}
              {role === 'STUDENT' && (
                <div className="space-y-2">
                  <Label htmlFor="reg-teacher-code" className="flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-muted-foreground" />
                    Codice Docente <span className="text-xs text-muted-foreground">(opzionale)</span>
                  </Label>
                  <Input
                    id="reg-teacher-code"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Inserisci il codice del tuo docente per iscriverti alla classe.
                  </p>
                </div>
              )}

              {/* Teacher: approval notice */}
              {role === 'TEACHER' && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Richiede approvazione
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        Gli account docente richiedono l&apos;approvazione dell&apos;amministratore. Riceverai una notifica quando il tuo account sarà attivato.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="size-4 mr-2" />
                )}
                Registrati
                {role === 'TEACHER' && (
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                    In attesa
                  </Badge>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
