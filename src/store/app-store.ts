import { create } from 'zustand'

/* ─── Types ──────────────────────────────────────────────────── */

import type { UserRole, UserStatus } from '@/lib/db'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  teacherCode: string | null
  createdAt: string
}

export type StudentView = 'dashboard' | 'essay-editor' | 'essay-detail' | 'profile'
export type TeacherView = 'dashboard' | 'student-detail' | 'notes' | 'class-preparations'
export type AdminView = 'dashboard' | 'users' | 'pending-teachers'
export type AppView = StudentView | TeacherView | AdminView

export interface EssayItem {
  id: string
  studentId: string
  title: string
  content: string
  status: string
  aiScore: number | null
  aiCorrection: Record<string, unknown> | null
  teacherNotes: string | null
  submittedAt: string | null
  correctedAt: string | null
  createdAt: string
  studentName?: string
}

export interface StudentItem {
  id: string
  name: string
  email: string
  enrolledAt: string
}

export interface NoteItem {
  id: string
  teacherId: string
  studentId: string
  content: string
  createdAt: string
  teacherName?: string
  studentName?: string
}

export interface PreparationItem {
  id: string
  teacherId: string
  title: string
  content: Record<string, unknown>
  generatedAt: string
}

export interface StatsData {
  totalEssays?: number
  correctedEssays?: number
  draftEssays?: number
  submittedEssays?: number
  averageScore?: number
  latestScore?: number | null
  totalStudents?: number
  totalTeachers?: number
}

/* ─── Token Persistence ──────────────────────────────────────── */

const TOKEN_KEY = 'scribia_token'

function loadToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // ignore
  }
}

/* ─── App Store ──────────────────────────────────────────────── */

interface AppState {
  // Auth
  user: AppUser | null
  token: string | null
  isAuthenticated: boolean

  // Navigation
  currentView: AppView
  currentEssay: EssayItem | null

  // Data
  students: StudentItem[]
  essays: EssayItem[]
  stats: StatsData | null
  notes: NoteItem[]
  preparations: PreparationItem[]

  // UI
  isLoading: boolean

  // Actions — Auth
  login: (user: AppUser, token: string) => void
  logout: () => void
  hydrateAuth: (token: string) => Promise<void>

  // Actions — Navigation
  setCurrentView: (view: AppView) => void
  setCurrentEssay: (essay: EssayItem | null) => void

  // Actions — Data fetching
  fetchEssays: () => Promise<void>
  fetchStudents: () => Promise<void>
  fetchStats: () => Promise<void>
  fetchNotes: () => Promise<void>
  fetchPreparations: () => Promise<void>

  // Actions — UI
  setLoading: (loading: boolean) => void
}

/* ─── API Helper (inline to avoid circular deps) ─────────────── */

async function apiRequest(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })
  if (res.status === 401) {
    saveToken(null)
    window.location.reload()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || 'Request failed')
  }
  return res.json()
}

/* ─── Store ──────────────────────────────────────────────────── */

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  token: loadToken(),
  isAuthenticated: false,

  // Navigation
  currentView: 'dashboard',
  currentEssay: null,

  // Data
  students: [],
  essays: [],
  stats: null,
  notes: [],
  preparations: [],

  // UI
  isLoading: false,

  // ─── Auth Actions ──────────────────────────────────────────

  login: (user, token) => {
    saveToken(token)
    set({ user, token, isAuthenticated: true, currentView: 'dashboard' })

    // Auto-fetch data on login
    const state = get()
    if (user.role === 'STUDENT') {
      state.fetchEssays()
      state.fetchStats()
    } else if (user.role === 'TEACHER') {
      state.fetchEssays()
      state.fetchStudents()
      state.fetchStats()
      state.fetchNotes()
      state.fetchPreparations()
    } else if (user.role === 'ADMIN') {
      state.fetchEssays()
      state.fetchStudents()
      state.fetchStats()
      state.fetchNotes()
    }
  },

  logout: () => {
    saveToken(null)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      currentView: 'dashboard',
      currentEssay: null,
      students: [],
      essays: [],
      stats: null,
      notes: [],
      preparations: [],
    })
  },

  hydrateAuth: async (token) => {
    try {
      const data = await apiRequest('/api/auth/me', token)
      const user = data.user as AppUser
      set({ user, token, isAuthenticated: true, currentView: 'dashboard' })

      // Auto-fetch data
      const state = get()
      if (user.role === 'STUDENT') {
        state.fetchEssays()
        state.fetchStats()
      } else if (user.role === 'TEACHER') {
        state.fetchEssays()
        state.fetchStudents()
        state.fetchStats()
        state.fetchNotes()
        state.fetchPreparations()
      } else if (user.role === 'ADMIN') {
        state.fetchEssays()
        state.fetchStudents()
        state.fetchStats()
        state.fetchNotes()
      }
    } catch {
      saveToken(null)
      set({ token: null, isAuthenticated: false, user: null })
    }
  },

  // ─── Navigation Actions ───────────────────────────────────

  setCurrentView: (currentView) => set({ currentView }),
  setCurrentEssay: (currentEssay) => set({ currentEssay }),

  // ─── Data Fetching Actions ────────────────────────────────

  fetchEssays: async () => {
    const { token } = get()
    if (!token) return
    try {
      const data = await apiRequest('/api/essays', token)
      set({ essays: data.essays || [] })
    } catch (error) {
      // silently handle error
    }
  },

  fetchStudents: async () => {
    const { token } = get()
    if (!token) return
    try {
      const data = await apiRequest('/api/enrollments', token)
      const enrollments = data.enrollments || []
      // Deduplicate students
      const seen = new Set<string>()
      const students: StudentItem[] = []
      for (const e of enrollments) {
        if (!seen.has(e.studentId)) {
          seen.add(e.studentId)
          students.push({
            id: e.studentId,
            name: e.studentName || 'Sconosciuto',
            email: '',
            enrolledAt: e.enrolledAt,
          })
        }
      }
      set({ students })
    } catch (error) {
      // silently handle error
    }
  },

  fetchStats: async () => {
    const { token } = get()
    if (!token) return
    try {
      const data = await apiRequest('/api/stats', token)
      set({ stats: data.stats || null })
    } catch (error) {
      // silently handle error
    }
  },

  fetchNotes: async () => {
    const { token } = get()
    if (!token) return
    try {
      const data = await apiRequest('/api/notes', token)
      set({ notes: data.notes || [] })
    } catch (error) {
      // silently handle error
    }
  },

  fetchPreparations: async () => {
    const { token } = get()
    if (!token) return
    try {
      const data = await apiRequest('/api/preparations', token)
      set({ preparations: data.preparations || [] })
    } catch (error) {
      // silently handle error
    }
  },

  // ─── UI Actions ───────────────────────────────────────────

  setLoading: (isLoading) => set({ isLoading }),
}))
