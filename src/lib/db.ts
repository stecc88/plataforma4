import { supabase } from './supabase'

/* ─── Case Conversion Utilities ──────────────────────────────── */

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value
  }
  return result
}

function toCamelCase<T>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value
  }
  return result as T
}

function toSnakeCaseArray<T extends Record<string, unknown>>(arr: T[]): Record<string, unknown>[] {
  return arr.map(toSnakeCase)
}

function toCamelCaseArray<T>(arr: Record<string, unknown>[]): T[] {
  return arr.map((item) => toCamelCase<T>(item))
}

/* ─── TypeScript Types ───────────────────────────────────────── */

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED'

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  role: UserRole
  status: UserStatus
  teacherCode: string | null
  createdAt: string
}

export type EssayStatus = 'DRAFT' | 'SUBMITTED' | 'CORRECTED'

export interface Essay {
  id: string
  studentId: string
  title: string
  content: string
  status: EssayStatus
  aiScore: number | null
  aiCorrection: Record<string, unknown> | null
  teacherNotes: string | null
  submittedAt: string | null
  correctedAt: string | null
  createdAt: string
}

export interface Enrollment {
  id: string
  studentId: string
  teacherId: string
  teacherCode: string
  enrolledAt: string
}

export interface TeacherNote {
  id: string
  teacherId: string
  studentId: string
  content: string
  createdAt: string
}

export interface ClassPreparation {
  id: string
  teacherId: string
  title: string
  content: Record<string, unknown>
  generatedAt: string
}

/* ─── Table Names ────────────────────────────────────────────── */

type TableName = 'users' | 'essays' | 'enrollments' | 'teacher_notes' | 'class_preparations'

/* ─── Repository Builder ─────────────────────────────────────── */

interface FindManyOptions {
  where?: Record<string, unknown>
  order?: string
  limit?: number
  offset?: number
}

interface FindUniqueOptions {
  where: Record<string, unknown>
}

interface CreateOptions<T> {
  data: T
}

interface UpdateOptions<T> {
  where: Record<string, unknown>
  data: Partial<T>
}

interface DeleteOptions {
  where: Record<string, unknown>
}

function buildFilters(query: any, filters: Record<string, unknown>) {
  let q = query
  for (const [key, value] of Object.entries(filters)) {
    const snakeKey = camelToSnake(key)
    if (value !== undefined && value !== null) {
      q = q.eq(snakeKey, value)
    }
  }
  return q
}

function createRepository<T>(tableName: TableName) {
  return {
    async findMany(options: FindManyOptions = {}): Promise<T[]> {
      try {
        let query = supabase.from(tableName).select('*')

        if (options.where) {
          query = buildFilters(query, options.where)
        }

        if (options.order) {
          const desc = options.order.startsWith('-')
          const col = desc ? options.order.slice(1) : options.order
          query = query.order(camelToSnake(col), { ascending: !desc })
        }

        if (options.limit) {
          query = query.limit(options.limit)
        }

        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
        }

        const { data, error } = await query

        if (error) throw error
        return toCamelCaseArray<T>(data || [])
      } catch (error) {
        throw error
      }
    },

    async findUnique(options: FindUniqueOptions): Promise<T | null> {
      try {
        let query = supabase.from(tableName).select('*')
        query = buildFilters(query, options.where)

        const { data, error } = await query.maybeSingle()

        if (error) throw error
        if (!data) return null
        return toCamelCase<T>(data)
      } catch (error) {
        throw error
      }
    },

    async create(options: CreateOptions<T>): Promise<T> {
      try {
        const snakeData = toSnakeCase(options.data as Record<string, unknown>)
        const { data, error } = await supabase
          .from(tableName)
          .insert(snakeData)
          .select('*')
          .single()

        if (error) throw error
        return toCamelCase<T>(data)
      } catch (error) {
        throw error
      }
    },

    async update(options: UpdateOptions<T>): Promise<T> {
      try {
        const snakeData = toSnakeCase(options.data as Record<string, unknown>)
        let query = supabase.from(tableName).update(snakeData)

        query = buildFilters(query, options.where)

        const { data, error } = await query.select('*')

        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error(`No record found to update in ${tableName}`)
        }
        return toCamelCase<T>(data[0])
      } catch (error) {
        throw error
      }
    },

    async delete(options: DeleteOptions): Promise<T> {
      try {
        let query = supabase.from(tableName).delete()

        query = buildFilters(query, options.where)

        const { data, error } = await query.select('*')

        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error(`No record found to delete in ${tableName}`)
        }
        return toCamelCase<T>(data[0])
      } catch (error) {
        throw error
      }
    },

    async count(options: FindManyOptions = {}): Promise<number> {
      try {
        let query = supabase.from(tableName).select('*', { count: 'exact', head: true })

        if (options.where) {
          query = buildFilters(query, options.where)
        }

        const { count, error } = await query

        if (error) throw error
        return count || 0
      } catch (error) {
        throw error
      }
    },
  }
}

/* ─── Database Client ────────────────────────────────────────── */

export const db = {
  user: createRepository<User>('users'),
  essay: createRepository<Essay>('essays'),
  enrollment: createRepository<Enrollment>('enrollments'),
  teacherNote: createRepository<TeacherNote>('teacher_notes'),
  classPreparation: createRepository<ClassPreparation>('class_preparations'),
}
