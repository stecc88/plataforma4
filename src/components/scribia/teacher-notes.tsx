'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { apiFetch } from './api-fetch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ClipboardList,
  Plus,
  Save,
  Loader2,
  Filter,
  StickyNote,
  User,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

/* ─── Animation Variants ─────────────────────────────────────── */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

/* ─── Types ──────────────────────────────────────────────────── */

interface NotesResponse {
  notes: typeof useAppStore extends { notes: infer N } ? N : never
}

/* ─── Note Item Component ────────────────────────────────────── */

function NoteItem({
  note,
  onEdit,
  onDelete,
}: {
  note: { id: string; studentId: string; studentName?: string; content: string; createdAt: string }
  onEdit: (note: typeof note) => void
  onDelete: (noteId: string) => void
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Student avatar */}
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold shrink-0">
              {(note.studentName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                >
                  <User className="size-3 mr-1" />
                  {note.studentName || 'Sconosciuto'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
            {/* Action buttons — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
                onClick={() => onEdit(note)}
                aria-label="Modifica nota"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                onClick={() => onDelete(note.id)}
                aria-label="Elimina nota"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ─── Teacher Notes Component ────────────────────────────────── */

export function TeacherNotes() {
  const { students, notes, fetchNotes } = useAppStore()

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [noteContent, setNoteContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<{
    id: string
    content: string
    studentName?: string
  } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter state
  const [filterStudentId, setFilterStudentId] = useState<string>('all')

  // Filtered notes
  const filteredNotes =
    filterStudentId === 'all'
      ? notes
      : notes.filter((n) => n.studentId === filterStudentId)

  /* ─── Create Note ──────────────────────────────────────────── */

  const handleCreateNote = useCallback(async () => {
    if (!selectedStudentId) {
      toast.error('Seleziona uno studente')
      return
    }
    if (!noteContent.trim()) {
      toast.error('Inserisci il contenuto della nota')
      return
    }

    setIsSaving(true)
    try {
      await apiFetch('/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          content: noteContent.trim(),
        }),
      })
      toast.success('Nota salvata con successo!')
      setDialogOpen(false)
      setSelectedStudentId('')
      setNoteContent('')
      await fetchNotes()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Errore nel salvataggio della nota"
      )
    } finally {
      setIsSaving(false)
    }
  }, [selectedStudentId, noteContent, fetchNotes])

  /* ─── Edit Note ────────────────────────────────────────────── */

  const handleOpenEdit = useCallback((note: { id: string; content: string; studentName?: string }) => {
    setEditingNote(note)
    setEditContent(note.content)
    setEditDialogOpen(true)
  }, [])

  const handleEditNote = useCallback(async () => {
    if (!editingNote || !editContent.trim()) {
      toast.error('Il contenuto della nota è obbligatorio')
      return
    }

    setIsEditing(true)
    try {
      await apiFetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        body: JSON.stringify({ content: editContent.trim() }),
      })
      toast.success('Nota aggiornata con successo!')
      setEditDialogOpen(false)
      setEditingNote(null)
      setEditContent('')
      await fetchNotes()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Errore nell'aggiornamento della nota"
      )
    } finally {
      setIsEditing(false)
    }
  }, [editingNote, editContent, fetchNotes])

  /* ─── Delete Note ──────────────────────────────────────────── */

  const handleOpenDelete = useCallback((noteId: string) => {
    setDeletingNoteId(noteId)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingNoteId) return

    setIsDeleting(true)
    try {
      await apiFetch(`/api/notes/${deletingNoteId}`, {
        method: 'DELETE',
      })
      toast.success('Nota eliminata con successo!')
      setDeleteDialogOpen(false)
      setDeletingNoteId(null)
      await fetchNotes()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Errore nell'eliminazione della nota"
      )
    } finally {
      setIsDeleting(false)
    }
  }, [deletingNoteId, fetchNotes])

  /* ─── Filter Notes ─────────────────────────────────────────── */

  const handleFilterChange = useCallback(
    async (value: string) => {
      setFilterStudentId(value)
      if (value !== 'all') {
        try {
          const data = await apiFetch<NotesResponse>(
            `/api/notes?studentId=${value}`
          )
          // Re-fetch silently; the client-side filter handles display
          if (data.notes) {
            void data // just confirm it works
          }
        } catch {
          // Silently fall back to client-side filtering
        }
      }
    },
    []
  )

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <StickyNote className="size-7 text-emerald-600 dark:text-emerald-400" />
              Le Mie Note
            </h2>
            <p className="text-muted-foreground mt-1">
              Gestisci le note sui tuoi studenti per tenere traccia dei progressi e delle osservazioni.
            </p>
          </div>

          {/* Create note dialog trigger */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-md">
                <Plus className="size-4 mr-2" />
                Nuova Nota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuova Nota</DialogTitle>
                <DialogDescription>
                  Aggiungi una nota su uno studente per tenere traccia delle tue osservazioni.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Student select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Studente</label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona uno studente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {students.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nessuno studente iscritto. Condividi il tuo codice insegnante!
                    </p>
                  )}
                </div>

                {/* Note content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contenuto</label>
                  <Textarea
                    placeholder="Scrivi la tua nota qui..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={5}
                    className="resize-y min-h-[120px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSaving}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleCreateNote}
                  disabled={!selectedStudentId || !noteContent.trim() || isSaving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  Salva Nota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Section */}
        {notes.length > 0 && students.length > 0 && (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Filter className="size-4 text-muted-foreground shrink-0" />
                <Select value={filterStudentId} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Filtra per studente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli studenti</SelectItem>
                    <Separator className="my-1" />
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filterStudentId !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20"
                    onClick={() => setFilterStudentId('all')}
                  >
                    <X className="size-3 mr-1" /> Rimuovi filtro
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              <ClipboardList className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nessuna nota.</p>
              <p className="text-sm mt-1">Aggiungi la prima nota!</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ─── Edit Note Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-amber-600 dark:text-amber-400" />
              Modifica Nota
            </DialogTitle>
            <DialogDescription>
              Modifica la nota per {editingNote?.studentName || 'lo studente'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={6}
              className="resize-y min-h-[140px]"
              placeholder="Modifica il contenuto della nota..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingNote(null)
              }}
              disabled={isEditing}
            >
              Annulla
            </Button>
            <Button
              onClick={handleEditNote}
              disabled={!editContent.trim() || isEditing}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
            >
              {isEditing ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-600 dark:text-red-400" />
              Elimina Nota
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa nota? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="size-4 mr-2" />
              )}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
