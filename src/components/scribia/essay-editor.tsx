'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type EssayItem } from '@/store/app-store'
import { apiFetch } from './api-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  PenLine,
  Save,
  Send,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Brain,
  GraduationCap,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type ItalianLevel,
  type CertificationType,
  type TextType,
  TEXT_TYPE_LABELS,
  CERTIFICATION_LABELS,
  LEVEL_LABELS,
} from '@/lib/ai-correction.types'

/* ─── Types ──────────────────────────────────────────────────── */

interface CreateEssayResponse {
  essay: EssayItem
}

interface CorrectEssayResponse {
  essay: EssayItem
  correction: Record<string, unknown>
}

/* ─── Status Badge Helper ────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'CORRECTED':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20">
          <CheckCircle2 className="size-3 mr-1" /> Corretto
        </Badge>
      )
    case 'SUBMITTED':
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
          <Clock className="size-3 mr-1" /> Inviato
        </Badge>
      )
    case 'DRAFT':
    default:
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          <FileText className="size-3 mr-1" /> Bozza
        </Badge>
      )
  }
}

/* ─── Loading Overlay ────────────────────────────────────────── */

function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 shadow-xl"
        >
          <Brain className="size-10 text-white" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-lg font-semibold text-foreground"
        >
          L&apos;IA sta correggendo il tuo testo...
        </motion.p>
        <p className="text-sm text-muted-foreground">Potrebbe richiedere qualche secondo</p>
      </div>
    </motion.div>
  )
}

/* ─── Essay Editor Component ─────────────────────────────────── */

export function EssayEditor() {
  const { essays, setCurrentView, setCurrentEssay, fetchEssays } = useAppStore()

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [level, setLevel] = useState<ItalianLevel>('B1')
  const [certification, setCertification] = useState<CertificationType>('CILS')
  const [textType, setTextType] = useState<TextType>('tema')

  // Validation state
  const [titleError, setTitleError] = useState<string | null>(null)
  const [contentError, setContentError] = useState<string | null>(null)

  // Submission state
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /* ─── Validation ──────────────────────────────────────────── */

  const validate = useCallback((): boolean => {
    let valid = true

    if (!title.trim()) {
      setTitleError('Il titolo è obbligatorio')
      valid = false
    } else {
      setTitleError(null)
    }

    if (!content.trim()) {
      setContentError('Il contenuto è obbligatorio')
      valid = false
    } else if (content.trim().length < 10) {
      setContentError('Il contenuto deve avere almeno 10 caratteri')
      valid = false
    } else {
      setContentError(null)
    }

    return valid
  }, [title, content])

  /* ─── Save Draft ──────────────────────────────────────────── */

  const handleSaveDraft = useCallback(async () => {
    if (!validate()) return

    setIsSavingDraft(true)
    try {
      const data = await apiFetch<CreateEssayResponse>('/api/essays', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      toast.success('Bozza salvata con successo!')
      await fetchEssays()
      setCurrentEssay(data.essay)
      setCurrentView('dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nel salvataggio della bozza')
    } finally {
      setIsSavingDraft(false)
    }
  }, [title, content, validate, fetchEssays, setCurrentEssay, setCurrentView])

  /* ─── Submit for Correction ───────────────────────────────── */

  const handleSubmitForCorrection = useCallback(async () => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      // Step 1: Create the essay
      const createData = await apiFetch<CreateEssayResponse>('/api/essays', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      const createdEssay = createData.essay

      // Step 2: Call AI correction with PLIDA/CILS parameters
      try {
        const correctData = await apiFetch<CorrectEssayResponse>(
          `/api/essays/${createdEssay.id}/correct`,
          {
            method: 'POST',
            body: JSON.stringify({ level, certification, textType }),
          }
        )

        toast.success('Correzione completata!')
        setCurrentEssay(correctData.essay)
        setCurrentView('essay-detail')
      } catch (correctionError) {
        // AI correction failed — still save as draft
        console.error('[EssayEditor] AI correction failed:', correctionError)
        toast.error("Errore nella correzione. Riprova.")
        setCurrentEssay(createdEssay)
        setCurrentView('dashboard')
      }

      await fetchEssays()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Errore nell'invio del saggio")
    } finally {
      setIsSubmitting(false)
    }
  }, [title, content, level, certification, textType, validate, fetchEssays, setCurrentEssay, setCurrentView])

  /* ─── Derived state ───────────────────────────────────────── */

  const isFormEmpty = !title.trim() || !content.trim()
  const isAnyLoading = isSavingDraft || isSubmitting

  /* ─── Render ──────────────────────────────────────────────── */

  return (
    <>
      {/* Loading overlay during AI correction */}
      <AnimatePresence>
        {isSubmitting && <LoadingOverlay />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Nuovo Saggio</h2>
          <p className="text-muted-foreground">
            Scrivi il tuo saggio in italiano e ricevi una correzione AI certificata PLIDA/CILS
          </p>
        </div>

        {/* Editor Card */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="essay-title" className="text-sm font-medium">
                Titolo
              </Label>
              <Input
                id="essay-title"
                placeholder="Titolo del tuo saggio..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError && e.target.value.trim()) setTitleError(null)
                }}
                onBlur={() => {
                  if (!title.trim()) setTitleError('Il titolo è obbligatorio')
                }}
                disabled={isAnyLoading}
                className={titleError ? 'border-destructive focus-visible:ring-destructive' : ''}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'title-error' : undefined}
              />
              {titleError && (
                <motion.p
                  id="title-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertCircle className="size-3.5" /> {titleError}
                </motion.p>
              )}
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <Label htmlFor="essay-content" className="text-sm font-medium">
                Contenuto
              </Label>
              <Textarea
                id="essay-content"
                placeholder="Scrivi il tuo saggio in italiano..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (contentError) {
                    if (e.target.value.trim().length >= 10) setContentError(null)
                  }
                }}
                onBlur={() => {
                  if (!content.trim()) {
                    setContentError('Il contenuto è obbligatorio')
                  } else if (content.trim().length < 10) {
                    setContentError('Il contenuto deve avere almeno 10 caratteri')
                  }
                }}
                disabled={isAnyLoading}
                className={`resize-y min-h-[250px] ${
                  contentError ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                rows={10}
                aria-invalid={!!contentError}
                aria-describedby={contentError ? 'content-error' : 'content-counter'}
              />
              <div className="flex items-center justify-between">
                {contentError ? (
                  <motion.p
                    id="content-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive flex items-center gap-1"
                  >
                    <AlertCircle className="size-3.5" /> {contentError}
                  </motion.p>
                ) : (
                  <span />
                )}
                <p
                  id="content-counter"
                  className={`text-xs ${
                    content.trim().length > 0 && content.trim().length < 10
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {content.length} caratteri
                  {content.trim().length > 0 && content.trim().length < 10 && (
                    <span> (minimo 10)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Correction Settings */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-semibold">Impostazioni Correzione</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Certification Selector */}
                <div className="space-y-2">
                  <Label htmlFor="essay-certification" className="text-sm font-medium">
                    Certificazione
                  </Label>
                  <Select value={certification} onValueChange={(v) => setCertification(v as CertificationType)} disabled={isAnyLoading}>
                    <SelectTrigger id="essay-certification">
                      <SelectValue placeholder="Seleziona certificazione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CERTIFICATION_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Selector */}
                <div className="space-y-2">
                  <Label htmlFor="essay-level" className="text-sm font-medium">
                    Livello QCER
                  </Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as ItalianLevel)} disabled={isAnyLoading}>
                    <SelectTrigger id="essay-level">
                      <SelectValue placeholder="Seleziona livello" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Type Selector */}
                <div className="space-y-2">
                  <Label htmlFor="essay-text-type" className="text-sm font-medium">
                    Tipo di Testo
                  </Label>
                  <Select value={textType} onValueChange={(v) => setTextType(v as TextType)} disabled={isAnyLoading}>
                    <SelectTrigger id="essay-text-type">
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEXT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                <BookOpen className="size-3 inline mr-1" />
                Queste impostazioni personalizzano la correzione AI secondo gli standard {certification} per il livello {level}.
              </p>
            </div>

            {/* Action Buttons */}
            <Separator />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isFormEmpty || isAnyLoading}
                className="flex-1 sm:flex-none"
              >
                {isSavingDraft ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                Salva bozza
              </Button>
              <Button
                onClick={handleSubmitForCorrection}
                disabled={isFormEmpty || isAnyLoading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                Correggi con AI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Essays List */}
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
              I Miei Saggi
            </CardTitle>
            <CardDescription>
              {essays.length === 0
                ? 'Non hai ancora scritto nessun saggio'
                : `${essays.length} saggi scritti`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {essays.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PenLine className="size-12 mx-auto mb-3 opacity-30" />
                <p>Inizia a scrivere il tuo primo saggio!</p>
                <p className="text-xs mt-1">
                  Compila il modulo qui sopra e ricevi una correzione AI
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {essays.map((essay, index) => (
                  <motion.button
                    key={essay.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => {
                      setCurrentEssay(essay)
                      setCurrentView('essay-detail')
                    }}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                  >
                    {/* Status icon */}
                    <div
                      className={`flex size-8 items-center justify-center rounded-md shrink-0 ${
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
                        <FileText className="size-4 text-muted-foreground" />
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
                        <span
                          className={`text-xs font-semibold ${
                            essay.aiScore >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {essay.aiScore}/100
                        </span>
                      )}
                      <StatusBadge status={essay.status} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
