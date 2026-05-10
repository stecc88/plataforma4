# ScribIA — Worklog

---
Task ID: 1
Agent: main
Task: Initialize ScribIA project — AI Italian writing assistant

Work Log:
- Explored existing project structure (Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui already configured)
- Installed missing packages: bcryptjs, @types/bcryptjs, jose, @supabase/supabase-js
- Verified all 19 required shadcn/ui components are present (button, card, input, label, textarea, select, tabs, dialog, sheet, badge, progress, separator, skeleton, avatar, table, tooltip, toast, sonner, dropdown-menu)
- Created .env.local with empty variables for NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, GEMINI_API_KEY
- Created .gitignore (node_modules, .next, .env*, db/, prisma/, logs, IDE files)
- Created src/lib/supabase.ts — Supabase client with service_role and anon key
- Created src/lib/auth.ts — JWT utilities (jose HS256) + password hashing (bcryptjs)
- Created src/store/auth.ts — Zustand auth store
- Created src/store/writing.ts — Zustand writing project store
- Updated src/app/layout.tsx — ScribIA branding, ThemeProvider, Italian lang
- Created src/app/page.tsx — Full Italian-themed landing page with:
  - Sticky header with mobile Sheet menu
  - Hero section with animated text reveal and Italian flag accent
  - 6 feature cards (grammar, generation, reformulation, style, translation, creative)
  - How it works (3 steps)
  - Pricing (3 plans)
  - Sticky footer
- Renamed package.json to "scribia"
- Lint passes with zero errors
- Dev server compiles and serves correctly
- Initial git commit made

Stage Summary:
- ScribIA project fully initialized and compiling
- All dependencies installed: Next.js 16, TypeScript 5, Tailwind CSS 4, shadcn/ui (NY), Framer Motion, Supabase, bcryptjs, jose, Zustand, z-ai-web-dev-sdk
- Landing page live at / with Italian-themed design, light/dark mode, animations
- No Prisma — using Supabase directly with service_role key

---
Task ID: 2
Agent: main
Task: Create core libraries — supabase, db wrapper, auth, ai

Work Log:
- Updated src/lib/supabase.ts — throws if env vars missing in production, placeholder values for dev
- Rewrote src/lib/db.ts — complete Prisma-like wrapper over Supabase:
  - Automatic camelCase → snake_case (outgoing) and snake_case → camelCase (incoming)
  - Generic createRepository<T>() factory with CRUD operations
  - db.user, db.essay, db.enrollment, db.teacherNote, db.classPreparation
  - Each has: findMany, findUnique, create, update, delete, count
  - Full TypeScript types: User, Essay, Enrollment, TeacherNote, ClassPreparation
  - UserRole, UserStatus, EssayStatus type unions
- Rewrote src/lib/auth.ts — complete JWT authentication:
  - JWT_SECRET throws in production if missing
  - AuthPayload: {userId, email, role, status}
  - ROLES: ADMIN, TEACHER, STUDENT
  - STATUSES: ACTIVE, PENDING, SUSPENDED
  - signToken(payload), verifyToken(token), getAuthFromRequest(request)
  - hashPassword(), verifyPassword() using bcryptjs
- Created src/lib/ai.ts — Gemini integration via z-ai-web-dev-sdk:
  - Singleton ZAI instance with lazy initialization
  - correctEssay(text, level) — returns EssayCorrection with:
    * correctedText, score (0-100), errors[], grammarNotes[], vocabularyNotes[], styleNotes[]
    * suggestions: {connectors[], synonyms[]}
    * studyTopics[]
  - generateLessonPreparation(weaknesses, level) — returns LessonPreparation with:
    * title, level, objectives, activities, exercises, homework, notes
  - Robust error handling: try/catch, JSON markdown extraction, fallback responses
- Created supabase/schema.sql — complete SQL for all 5 tables with:
  - UUID PKs with gen_random_uuid()
  - CHECK constraints for role, status enums
  - Foreign keys with ON DELETE CASCADE
  - Indexes for performance
  - RLS enabled with permissive policies for service_role and anon
  - GRANT ALL for service_role and anon
- Lint passes with zero errors
- Committed: feat: add core libraries — supabase, db wrapper, auth, ai

Stage Summary:
- All 4 core libraries created/updated and fully typed
- Prisma completely replaced with Supabase wrapper
- AI integration uses z-ai-web-dev-sdk (not @google/generative-ai)
- SQL schema ready for Supabase SQL Editor
- 5 tables: users, essays, enrollments, teacher_notes, class_preparations

---
Task ID: 3
Agent: main
Task: Create authentication API routes

Work Log:
- Created POST /api/auth/register — user registration:
  - Input validation: email, password (min 6), name (min 2), role
  - Email uniqueness check (409 if exists)
  - ADMIN: only allowed if no admin exists yet (403 if one exists)
  - TEACHER: status=PENDING (needs admin approval), auto-generates 6-char uppercase teacher_code
  - STUDENT with teacherCode: auto-creates enrollment
  - Password hashing with bcryptjs (12 salt rounds)
  - Returns {token, user} (user without password_hash)
- Created POST /api/auth/login — user login:
  - Email + password verification
  - PENDING status → 403 error
  - SUSPENDED status → 403 error
  - Returns {token, user} (user without password_hash)
- Created GET /api/auth/me — get current user:
  - Requires Authorization: Bearer <token>
  - Returns {user} (without password_hash)
- Created POST /api/generate-teacher-code — admin-only:
  - ADMIN role required (403 otherwise)
  - Generates unique 6-char uppercase alphanumeric code
  - Collision detection with retry loop
  - Returns {teacherCode}
- Created GET /api/enrollments — role-based listing:
  - STUDENT sees their enrollments
  - TEACHER sees their students
  - ADMIN sees all
  - Ordered by enrolledAt desc
- All routes use NextRequest/NextResponse, try/catch, input validation, db wrapper, auth helpers
- Lint passes with zero errors
- Committed: feat: add authentication APIs

Stage Summary:
- 5 API routes created with full error handling and validation
- Authentication flow: register → login → me
- Role-based access control on all endpoints
- All responses sanitized (no password_hash leaked)

---
Task ID: 4
Agent: main
Task: Create essay, stats, notes, and preparation API routes

Work Log:
- Created GET/POST /api/essays — list and create essays:
  - Student: own essays only, can create with DRAFT status
  - Teacher: essays from enrolled students (uses supabase IN clause)
  - Admin: all essays
  - Enriched with student names via supabase user lookup
  - Filter by ?studentId=&status= query params
- Created GET /api/essays/[id] — get specific essay:
  - Permission checks: owner (student), enrolled teacher, admin
  - Returns essay with studentName
- Created POST /api/essays/[id]/correct — AI correction (CRITICAL):
  - Only STUDENT can correct own essays
  - Calls correctEssay() from ai.ts with optional level param (A1-C2)
  - Robust error handling: if AI fails, returns 500 with Spanish message
  - console.error for debugging AI failures
  - Saves ai_correction as JSON, updates status to CORRECTED
  - Sets ai_score and corrected_at
- Created POST /api/essays/[id]/self-assess — self-assessment:
  - Body: {selfScore (0-100), selfNotes}
  - Merges selfAssessment into existing ai_correction JSON
- Created GET /api/stats — role-based statistics:
  - Student: own stats (totalEssays, correctedEssays, draftEssays, submittedEssays, averageScore, latestScore)
  - Teacher: students' stats (includes totalStudents)
  - Admin: global stats (includes totalStudents, totalTeachers)
  - Average score calculated from corrected essays via supabase
- Created GET/POST /api/notes — teacher notes:
  - GET: Teacher sees own notes, Student sees notes about them, Admin sees all
  - POST: Teacher/Admin can create notes (with enrollment verification for teachers)
  - Enriched with teacherName and studentName
  - Filter by ?studentId= query param
- Created GET /api/preparations — list class preparations (Teacher/Admin)
- Created POST /api/preparations/generate — AI lesson generation:
  - Accepts {weaknesses[], level, studentId?, title?}
  - Auto-derives weaknesses from student's corrected essays if studentId provided
  - Calls generateLessonPreparation() from ai.ts
  - Saves to database with full lesson structure
  - Returns {preparation, lesson}
- Lint passes with zero errors
- Committed: feat: add essay, stats, notes, and preparation APIs

Stage Summary:
- 8 API route files created (10 endpoints total)
- Full CRUD for essays with AI correction integration
- Role-based access control on all endpoints
- Supabase used directly for complex queries (IN, joins, aggregations)
- All error handling robust with console.error for debugging
