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
