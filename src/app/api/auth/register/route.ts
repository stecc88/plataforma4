import { NextRequest, NextResponse } from 'next/server'
import { db, type User, type UserRole, type UserStatus } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { hashPassword, signToken, ROLES, STATUSES } from '@/lib/auth'
import { sanitizeUser, generateTeacherCode } from '@/lib/utils-user'

/* ─── POST /api/auth/register ────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    // ─── Supabase configuration check ──────────────────────
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase non configurato. Aggiungi NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nel file .env.local' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { email, password, name, role, teacherCode } = body as {
      email?: string
      password?: string
      name?: string
      role?: string
      teacherCode?: string
    }

    // ─── Input validation ───────────────────────────────────
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'La password deve avere almeno 6 caratteri' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Il nome deve avere almeno 2 caratteri' },
        { status: 400 }
      )
    }

    // Public registration only allows STUDENT and TEACHER roles.
    // ADMIN accounts must be created through a separate admin endpoint or directly in the database.
    const validRoles: UserRole[] = [ROLES.STUDENT, ROLES.TEACHER]
    if (!role || !validRoles.includes(role as UserRole)) {
      return NextResponse.json(
        { error: 'Ruolo non valido. Usa: STUDENT o TEACHER' },
        { status: 400 }
      )
    }

    // ─── Explicitly block ADMIN role from public registration ──
    if (role === ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'La registrazione come ADMIN non è consentita.' },
        { status: 403 }
      )
    }

    // ─── Check if email already exists ──────────────────────
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 409 }
      )
    }

    // ─── Hash password ──────────────────────────────────────
    const passwordHash = await hashPassword(password)

    // ─── Determine status ───────────────────────────────────
    let status: UserStatus = STATUSES.ACTIVE
    if (role === ROLES.TEACHER) {
      status = STATUSES.PENDING // Teachers need admin approval
    }

    // ─── Generate teacher_code for teachers ─────────────────
    let userTeacherCode: string | null = null
    if (role === ROLES.TEACHER) {
      let codeExists = true
      while (codeExists) {
        userTeacherCode = generateTeacherCode()
        const existing = await db.user.findUnique({
          where: { teacherCode: userTeacherCode },
        })
        codeExists = existing !== null
      }
    }

    // ─── Create user ────────────────────────────────────────
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role,
        status,
        teacherCode: userTeacherCode,
      } as unknown as User,
    })

    // ─── If STUDENT with teacherCode, create enrollment ─────
    if (role === ROLES.STUDENT && teacherCode) {
      const teacher = await db.user.findUnique({
        where: { teacherCode },
      })

      if (teacher && teacher.role === ROLES.TEACHER) {
        try {
          await db.enrollment.create({
            data: {
              studentId: user.id,
              teacherId: teacher.id,
              teacherCode,
            } as unknown as import('@/lib/db').Enrollment,
          })
        } catch (enrollmentError) {
          // Don't fail registration if enrollment fails
        }
      }
    }

    // ─── Generate JWT ───────────────────────────────────────
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    return NextResponse.json(
      {
        token,
        user: sanitizeUser(user),
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    )
  }
}
