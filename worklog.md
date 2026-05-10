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

---
Task ID: 5
Agent: main
Task: Create global store, AppShell, and auth-aware page

Work Log:
- Created src/store/app-store.ts — Zustand store with:
  - Full state: user, token, currentView, currentEssay, students, essays, stats, notes, preparations, isLoading
  - Token persistence in localStorage (TOKEN_KEY = 'scribia_token')
  - Auto-fetch data on login (role-based: student→essays+stats, teacher→essays+students+stats+notes+preparations, admin→essays+students+stats+notes)
  - hydrateAuth(token) for session restore from localStorage
  - All fetch actions with try/catch error handling
  - Types: AppUser, AppView, EssayItem, StudentItem, NoteItem, PreparationItem, StatsData
- Created src/components/scribia/api-fetch.ts — API helper:
  - apiFetch() adds Authorization header automatically from store
  - 401 → auto-logout via useAppStore.getState().logout()
  - apiFetchPublic() for login/register (no auth header)
  - Centralized error handling with JSON parsing
- Created src/components/scribia/app-shell.tsx — Main application shell:
  - Desktop Sidebar with role-based navigation and user info
  - Mobile Sidebar (Sheet) for responsive design
  - Header with theme toggle and logout
  - Content area rendering views based on currentView:
    - Student: dashboard (stats cards, recent essays), essay-editor, essay-detail, profile
    - Teacher: dashboard (stats, student list), student-detail, notes, class-preparations
    - Admin: dashboard (global stats), users, pending-teachers
  - All views with proper empty states and Italian labels
  - ThemeToggle with Framer Motion animations
- Updated src/app/page.tsx — Main page:
  - Not authenticated: LandingPage with AuthForm overlay
  - Authenticated: AppShell
  - AuthInitializer for session hydration from localStorage token
  - AuthForm with login/register toggle, role selection, teacher code input
  - Landing page with same design (hero, features, how it works, pricing, footer)
  - All CTA buttons now open auth modal
- Updated src/app/layout.tsx:
  - Inter font (replacing Geist)
  - ThemeProvider (next-themes) with attribute="class"
  - Sonner Toaster (richColors, position="top-right")
- Updated src/app/globals.css: font-sans → --font-inter
- Lint passes with zero errors
- Committed: feat: add global store, AppShell, and auth-aware page

Stage Summary:
- Complete auth flow: landing → register/login → AppShell with role-based views
- Zustand store with localStorage token persistence and auto-fetch
- Responsive AppShell with sidebar (desktop) and sheet (mobile)
- 3 role-specific dashboards with stats cards
- AuthForm with login/register modes and role selection
- Inter font and Sonner Toaster in layout

---
Task ID: 6
Agent: main
Task: Extract landing page and create tabbed auth form

Work Log:
- Created src/components/landing-page.tsx — Standalone landing page component:
  - Hero: ScribIA gradient title + subtitle "Il tuo assistente per la scrittura in italiano"
  - 6 features with Lucide icons: PenLine, BookOpen, Brain, GraduationCap, Languages, Lightbulb
  - CTA button "Inizia ora" (emerald/teal accent)
  - Benefits section: side-by-side cards for Students (4 benefits) and Teachers (4 benefits)
  - How it works (3 steps with Brain icon)
  - Pricing (3 plans)
  - Sticky footer with min-h-screen flex flex-col
  - Framer Motion animations (fade in, slide up, stagger)
  - Responsive mobile-first, white bg, emerald/teal accents (NO indigo/blue)
  - onOpenAuth callback prop for triggering auth modal
- Created src/components/scribia/auth-form.tsx — Enhanced auth form with Tabs:
  - shadcn/ui Tabs: Login / Registrati
  - Login: email, password with inline validation
  - Register: name, email, password, confirm password, role Select (Studente/Docente)
  - Studente: optional "Codice Docente" input with KeyRound icon
  - Docente: amber warning "Richiede approvazione dell'amministratore"
  - Form validation with inline error messages (red border + AlertCircle icon)
  - Loading states (Loader2 spinner) on submit buttons
  - Toast notifications (sonner) on success/error
  - Student → direct dashboard; Teacher → pending approval info toast
  - onSuccess callback for closing auth modal
- Updated src/app/page.tsx — Simplified to use new components:
  - LandingPage component with onOpenAuth callback
  - AuthForm with Tabs in AnimatePresence modal overlay
  - Clean separation of concerns
- Lint passes with zero errors
- Committed: feat: extract landing page and create tabbed auth form

Stage Summary:
- Landing page and auth form extracted into dedicated components
- Tabbed auth with Login/Registrati, role-based fields
- Student: teacher code input; Teacher: approval warning
- Full validation, loading states, toast notifications
- Clean component architecture in page.tsx

---
Task ID: 3
Agent: essay-editor-agent
Task: Create full essay editor component for ScribIA

Work Log:
- Created src/components/scribia/essay-editor.tsx — Full essay editor component:
  - Editor Form with title Input, large Textarea (min-h-[250px], 10 rows), character counter
  - CEFR Level selector (A1–C2) using shadcn Select, default B1
  - Inline validation: title required, content min 10 characters, with red borders + AlertCircle icons
  - "Salva bozza" button (outline variant): POST /api/essays → navigate to dashboard
  - "Invia per correzione" button (emerald→teal gradient): POST /api/essays then POST /api/essays/[id]/correct
  - Both buttons disabled when title or content is empty, loading spinners during operations
  - AI Correction Flow: two-step (create essay → correct with level), full loading overlay with Brain icon + pulsing animation
  - Error handling: correction failure → toast.error, still save as draft, navigate to dashboard
  - Existing essays list below editor with status badges (Bozza/gray, Inviato/amber, Corretto/emerald)
  - Click essay → setCurrentEssay + setCurrentView('essay-detail')
  - Framer Motion fade-in for form, stagger animation for essay list items, pulsing loading overlay
  - Card with bg-card/80 backdrop-blur-sm, responsive flex-col sm:flex-row button layout
  - 'use client', exports EssayEditor, uses useAppStore + apiFetch
- Updated src/components/scribia/app-shell.tsx:
  - Imported EssayEditor from './essay-editor'
  - Replaced placeholder EssayEditorView with <EssayEditor /> component
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- Complete essay editor with create, save draft, and AI correction flows
- Full validation, loading states, error handling with toast notifications
- Existing essays list with status badges and click-to-detail navigation
- Framer Motion animations throughout
- Integrated into AppShell replacing placeholder

---
Task ID: 5
Agent: profile-section-agent
Task: Create comprehensive student profile section component

Work Log:
- Created src/components/scribia/profile-section.tsx — Full profile section with 4 sub-sections:
  - StudentInfoCard: avatar with emerald→teal gradient initial, name, email, role badge (color-coded), member since date (localized Italian), teacher code if available
  - ProgressStatistics: total essays, corrected (with percentage), submitted, drafts — each with Progress bar component; average score and latest score in bordered stat boxes with color-coded values
  - ImprovementSuggestions (key section): aggregates data from all corrected essays' aiCorrection:
    * Connettori raccomandati: counts connector frequency across suggestions.connectors, displays as teal badges with ×count
    * Sinonimi per parole ripetute: aggregates suggestions.synonyms, merges alternatives for same word, shows repeated words with alternatives as emerald badges
    * Aree deboli identificate: groups errors by type, calculates frequency/percentage, shows with color-coded Progress bars (red=most frequent, amber=2nd, teal=rest); Italian labels for common error types
  - EssayHistory (Storico Saggi): sorted by creation date (newest first), each with status badge + score badge, mini bar chart for score trend (≥2 corrected essays), trend icon (TrendingUp/Down/Minus), click → setCurrentEssay + setCurrentView('essay-detail')
- Framer Motion animations: containerVariants with staggerChildren, itemVariants with fade-in + slide-up
- Empty states: "Non hai ancora saggi corretti. Scrivi il tuo primo saggio!" for no corrected essays, "Continua a scrivere per ricevere suggerimenti personalizzati!" for no suggestions
- Responsive layout: 1 col mobile, 2 col desktop grid for info+stats and suggestions
- Color scheme: emerald/teal primary with amber accents, NO indigo/blue
- Updated src/components/scribia/app-shell.tsx:
  - Imported ProfileSection from './profile-section'
  - Replaced old ProfileView inline implementation with <ProfileSection />
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- Comprehensive profile section with student info, progress stats, AI-powered improvement suggestions, and essay history with score trend
- Data aggregation from corrected essays for personalized learning insights
- Full Italian language UI with proper empty states
- Framer Motion stagger animations
- Integrated into AppShell replacing old simple profile view

---
Task ID: 4
Agent: essay-detail-agent
Task: Create comprehensive essay detail view with AI correction results

Work Log:
- Created src/components/scribia/essay-detail.tsx — Full essay detail component (~680 lines):
  - Types: CorrectionError, CorrectionSuggestions, AICorrection interfaces matching the AI correction data structure
  - ERROR_TYPE_CONFIG: color-coded config for 6 error types (grammar, spelling, syntax, punctuation, vocabulary, style) with Italian labels, color classes, underline CSS, badge classes, CEFR level references
  - AnimatedScore: SVG circular progress bar with Framer Motion animation (1.5s easeOut), color: emerald (≥70), amber (40-69), red (<40), score number in center with scale animation
  - AnnotatedText: Original text with error highlights using position-based segmentation, color-coded underlines by type, falls back to plain text if no valid position data, title tooltip shows explanation
  - ErrorCard with Collapsible: type badge, original→correction, explanation, "Clicca per i dettagli completi" trigger, expanded: Regola Grammaticale, Esempi (errato/corretto with icons), Livello QCER badge
  - SelfAssessmentDialog: 3-step (Rivedere errori → Auto-punteggio → Riflessione), error summary with checkbox, AnimatedScore + Slider for self-score, Textarea for notes, POST /api/essays/[id]/self-assess, read-only if already assessed, DialogDescription for accessibility
  - Main EssayDetail: back button, redirect if no essay, "non corretto" message with original text, score card with AnimatedScore, Tabs (Originale/Corretto/Errori/Suggerimenti), annotated text with legend, corrected text, error cards + grammar notes, vocabulary/style/study topics sections, teacher notes
  - FadeIn animation wrapper for staggered section animations
- Updated src/components/scribia/app-shell.tsx: imported EssayDetail, replaced inline EssayDetailView with <EssayDetail />
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- Comprehensive essay detail view with full AI correction results display
- Animated circular score, error annotations with collapsible details
- Self-assessment 3-step dialog with read-only mode
- Tabbed navigation: Original/Corrected/Errors/Suggestions
- Italian language UI, emerald/teal/amber color scheme, Framer Motion animations
- Integrated into AppShell replacing old simple essay detail view

---
Task ID: 2-c
Agent: admin-api-agent
Task: Create 3 admin API routes for ScribIA

Work Log:
- Created GET /api/admin/users/route.ts — Admin-only user listing:
  - JWT verification via getAuthFromRequest, 401/403 checks
  - Optional query filters: ?role=STUDENT|TEACHER|ADMIN, ?status=ACTIVE|PENDING|SUSPENDED
  - Uses supabase directly for efficient querying (selects only id, email, name, role, status, teacher_code, created_at)
  - password_hash excluded from select (never fetched from DB)
  - Ordered by created_at desc
  - snake_case → camelCase conversion for all response keys
  - Returns { users: [...] }
- Created POST /api/admin/approve-teacher/route.ts — Teacher approval:
  - Admin-only, JWT verified
  - Body: { userId: string }
  - Validates user exists, role=TEACHER, status=PENDING (400 errors otherwise)
  - Generates unique 6-char uppercase alphanumeric teacher_code with retry loop (up to 50 attempts)
  - Updates user status to ACTIVE and assigns teacher_code
  - Returns { user: updatedUser } with camelCase keys, no password_hash
- Created POST /api/admin/suspend-user/route.ts — Suspend/activate users:
  - Admin-only, JWT verified
  - Body: { userId: string, action: 'suspend' | 'activate' }
  - Cannot suspend yourself (userId === auth.userId → 400)
  - Cannot suspend admin users (→ 400)
  - Updates status to SUSPENDED (action=suspend) or ACTIVE (action=activate)
  - Returns { user: updatedUser } with camelCase keys, no password_hash
- All routes use NextRequest/NextResponse, try/catch with console.error, proper Italian error messages
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- 3 admin API routes created with full auth checks, validation, and error handling
- All responses sanitized (no password_hash leaked, camelCase keys)
- Supabase used directly for efficient queries with selective column fetching
- Consistent error handling pattern across all routes

---
Task ID: 2-e
Agent: stats-charts-agent
Task: Create reusable stats chart components using shadcn/ui chart (recharts)

Work Log:
- Created src/components/scribia/stats-charts.tsx — Reusable chart component with 4 exports:
  - ScoreProgressChart (LineChart): emerald line (#10b981), monotone curve, dots on data points, X/Y axes (0-100), ChartConfig with "score" key / "Punteggio" label, empty state "Nessun dato disponibile"
  - CategoryScoresChart (BarChart): vertical bars with dynamic colors (emerald=highest, amber=medium, teal=others), X/Y axes (0-100), dynamic ChartConfig per category, rounded bar tops
  - ErrorDistributionChart (PieChart): donut style (innerRadius=50, outerRadius=80), 6 color-coded error types (grammar=#ef4444, spelling=#f97316, punctuation=#f59e0b, vocabulary=#10b981, syntax=#14b8a6, style=#06b6d4), Italian labels via ERROR_TYPE_LABELS, dynamic ChartConfig, legend with nameKey="type"
  - StatsCharts (main export): derives all chart data from EssayItem[] via useMemo:
    * ScoreProgress: corrected essays sorted by date, Italian month abbreviations (Gen, Feb, etc.)
    * CategoryScores: aggregates grammarNotes/vocabularyNotes/styleNotes lengths, maps to inverse scores (fewer notes = higher score)
    * ErrorDistribution: groups errors by type from aiCorrection.errors, sorted by count descending
    * Responsive grid: 1 col mobile, 2 col desktop (score progress spans full width on lg)
    * Empty state when no corrected essays
- Uses ChartContainer from shadcn/ui (NOT raw ResponsiveContainer), ChartTooltip/ChartTooltipContent, ChartLegend/ChartLegendContent
- All Italian language UI labels
- 'use client' directive, TypeScript strict typing
- Lint passes with zero errors
- Dev server compiles correctly

Stage Summary:
- 4 chart components created: ScoreProgressChart, CategoryScoresChart, ErrorDistributionChart, StatsCharts
- Data derivation from EssayItem[] with useMemo for performance
- shadcn/ui ChartContainer used throughout (wraps recharts ResponsiveContainer internally)
- Italian language labels, emerald/teal/amber color scheme, no indigo/blue
- All ChartConfig properly defined with labels and colors

---
Task ID: 2-b
Agent: teacher-notes-preparations-agent
Task: Create TeacherNotes and ClassPreparations components

Work Log:
- Created src/components/scribia/teacher-notes.tsx — Teacher notes management component:
  - Header: "Le Mie Note" with StickyNote icon and description
  - Create note: Dialog with DialogDescription (accessibility), student Select dropdown from store, Textarea for content, "Salva Nota" button
  - POST /api/notes with { studentId, content }, refreshes notes via fetchNotes, toast success/error
  - Filter section: Select dropdown to filter notes by student ("Tutti gli studenti" + each student)
  - Filter badge with click-to-remove, client-side filtering of notes
  - Notes list: student name badge with User icon, localized date (day/month/year + hour:minute), content with whitespace preservation
  - Framer Motion stagger animation (containerVariants + itemVariants)
  - Empty state: "Nessuna nota. Aggiungi la prima nota!"
  - Student avatar initial with emerald styling
- Created src/components/scribia/class-preparations.tsx — Class preparations with AI generation:
  - Header: "Preparazioni di Classe" with GraduationCap icon and description
  - "Genera Preparazione AI" button (emerald→teal gradient):
    - Analyzes weaknesses from ALL students' corrected essays:
      1. Iterates over essays where status='CORRECTED' and aiCorrection is not null
      2. Collects all errors by type with frequency counts
      3. Collects all studyTopics (deduplicated)
      4. Aggregates into a weaknesses array (sorted by error frequency)
    - Auto-detects CEFR level from average score (A1-C2 mapping)
    - Calls POST /api/preparations/generate with { weaknesses, level }
  - Loading overlay: fixed overlay with Brain icon pulsing + "Generando preparazione..." (matches essay-editor pattern)
  - On success: refreshes preparations, toast success, auto-expands the new preparation
  - On error: toast "Errore nella generazione. Riprova."
  - PreparationCard: Collapsible card with title, date, level badge
    - Objectives list with Target icon
    - Activities with name, description, duration badge (Dumbbell icon)
    - Exercises with type badge, instruction (ListChecks icon)
    - Homework list (Home icon)
    - Notes list (StickyNote icon)
    - Animated chevron rotation on open/close
  - WeaknessSummary sub-component: stats grid (corrected essays, total errors, average score), error type badges, study topic badges
  - Info card when no corrected essays available (amber accent)
  - Empty state: "Nessuna preparazione. Genera la prima preparazione con AI!"
  - Framer Motion stagger animations throughout
- Updated src/components/scribia/app-shell.tsx:
  - Imported TeacherNotes from './teacher-notes'
  - Imported ClassPreparations from './class-preparations'
  - Replaced inline NotesView with <TeacherNotes />
  - Replaced inline PreparationsView with <ClassPreparations />
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- Two complete 'use client' components created and integrated into AppShell
- TeacherNotes: full CRUD with dialog, filtering, stagger animations, Italian UI
- ClassPreparations: AI generation with weakness analysis, loading overlay, collapsible content, weakness summary
- Both use apiFetch, toast from sonner, emerald/teal color scheme, NO indigo/blue
- DialogDescription included in create note dialog for accessibility

---
Task ID: 2-a
Agent: teacher-student-detail-agent
Task: Create teacher dashboard and student detail components

Work Log:
- Created src/components/scribia/teacher-state.ts — Simple shared state module:
  - Module-level variables for selected student (id, name, email, enrolledAt)
  - setSelectedStudent() to update state + notify listeners
  - getSelectedStudent() to read current selection
  - subscribe() for React integration (useSyncExternalStore compatible)
  - Used by both teacher-dashboard and student-detail to pass selected student data
- Created src/components/scribia/teacher-dashboard.tsx — Teacher overview dashboard:
  - Header: "Bentornato, {name}!" greeting + teacher code badge
  - Stats cards (2x2 / 4 cols grid): Total Studenti, Saggi Corretti, Media Punteggi, Saggi in Attesa
  - Each stat card with icon, value, label, colored accent bar (emerald/teal/amber/orange)
  - Framer Motion stagger animation for all sections
  - Average Score Highlight card (conditional): gradient bar, TrendingUp icon, contextual message
  - Student list card with:
    - Avatar initial (emerald→teal gradient), name, enrolled date
    - Essay count badge (derived from essays.filter by studentId)
    - Latest score badge (from their corrected essays, color-coded)
    - Click → setSelectedStudent + setCurrentView('student-detail')
  - Quick actions: "Aggiungi nota" (→ notes view), "Genera preparazione" (→ class-preparations view)
  - Empty states: teacher code display when no students, placeholder text
  - Italian language, emerald/teal/amber colors, NO indigo/blue
- Created src/components/scribia/student-detail.tsx — Student detail view for teachers:
  - Header: back button (→ dashboard), student avatar + name
  - Add Note dialog: DialogDescription for accessibility, Textarea, POST /api/notes, toast notifications
  - Student info card: 4-grid layout (Name, Email, Enrolled date, Teacher code)
  - Quick stats: 4 mini cards (Total essays, Corrected, Average score, Latest score with trend icon)
  - Essay list: fetched from apiFetch('/api/essays?studentId='), sorted by date
    - Each essay: status icon, title, date, score badge, status badge
    - Click → setCurrentEssay + setCurrentView('essay-detail')
  - Weakness Profile card (when corrected essays exist):
    - Error type distribution: aggregated from all aiCorrection.errors, sorted by frequency
    - Progress bars for each error type with Italian labels + color-coded badges
    - Study topics: deduplicated from aiCorrection.studyTopics as teal badges
    - Score trend: mini bar chart with animated heights, trend indicator (up/down/stable)
  - Empty state when no student selected: "Seleziona uno studente dalla dashboard" with back button
  - Italian language, emerald/teal/amber colors, Framer Motion animations
- Updated src/components/scribia/app-shell.tsx:
  - Imported TeacherDashboard from './teacher-dashboard'
  - Imported StudentDetail from './student-detail'
  - Replaced inline TeacherDashboard with imported component
  - Replaced inline student-detail placeholder with <StudentDetail />
  - Removed unused CheckCircle2 import
- Lint passes with zero errors
- Dev server compiles and serves correctly

Stage Summary:
- Teacher dashboard with rich stats, clickable student list, and quick actions
- Student detail view with essay list, weakness profiling, and add note dialog
- Shared teacher-state.ts for passing selected student between views
- Both components fully integrated into AppShell replacing inline placeholders
- Italian language UI, emerald/teal/amber color scheme, Framer Motion animations

---
Task ID: 2-d
Agent: admin-dashboard-agent
Task: Create comprehensive admin dashboard component

Work Log:
- Created src/components/scribia/admin-dashboard.tsx — Full admin dashboard (~820 lines):
  - Stats Overview: 4 stat cards with Framer Motion stagger animation (Studenti totali/emerald, Docenti/amber, Saggi totali/teal, Punteggio medio/orange), accent color bars, hover scale
  - Tabs: "Utenti" | "Docenti in Attesa" | "Statistiche" using shadcn Tabs
  - Tab 1 "Utenti": User management table with role/status filter dropdowns, RoleBadge/StatusBadge components, action buttons (Sospendi/Attiva/Approva), loading states, empty state
  - Tab 2 "Docenti in Attesa": Card-based layout, Approva/Rifiuta buttons, confirmation Dialog with DialogDescription, loading on confirm, badge count on tab, empty state
  - Tab 3 "Statistiche": StatsCharts component from @/components/scribia/stats-charts, empty state when no data
  - All actions refresh data (fetchUsers + fetchPendingTeachers + fetchStats), toast notifications
  - Confirmation dialog with DialogTitle, DialogDescription, teacher preview, Annulla/Confirm
  - Responsive grid, Framer Motion animations
- Updated src/components/scribia/stats-charts.tsx — Stats visualization with score distribution, status breakdown, recent essays, average score + trend
- Updated src/components/scribia/app-shell.tsx: imported AdminDashboard, replaced inline admin views with <AdminDashboard />, cleaned up unused imports
- Lint passes with zero errors, dev server compiles correctly

Stage Summary:
- Comprehensive admin dashboard with 3 tabs: user management, pending teacher approval, statistics
- Full CRUD actions with confirmation dialogs, loading states, toast notifications
- StatsCharts component with score distribution, status breakdown, recent essays
- Italian UI, emerald/teal/amber/orange colors, NO indigo/blue
- Responsive, Framer Motion animations, proper accessibility (DialogDescription in all dialogs)

---
Task ID: 8
Agent: main
Task: PROMPT 8 — Teacher/Admin dashboards with recharts, note CRUD, and progress indicators

Work Log:
- Rewrote src/components/scribia/stats-charts.tsx to use recharts via shadcn/ui ChartContainer:
  * ScoreProgressChart: LineChart with monthly score averages, emerald line (#10b981), monotone curve, dots, X/Y axes (0-100)
  * CategoryScoresChart: BarChart with vertical bars per error category, dynamic colors, rounded tops
  * ErrorDistributionChart: PieChart donut style (innerRadius=50, outerRadius=90), 6 color-coded error types with Italian labels, legend
  * StatsCharts main component: derives data from essays via useMemo, responsive grid layout (line full-width on lg), quick stats grid, recent essays list
  * Uses ChartContainer, ChartTooltip/ChartTooltipContent, ChartLegend/ChartLegendContent from shadcn/ui
- Created PUT/DELETE /api/notes/[id]/route.ts:
  * PUT: update note content, teacher can only edit own notes, admin can edit any
  * DELETE: delete note, same permission rules, returns { success: true }
  * Full auth checks (JWT, role verification), validation, Italian error messages
- Enhanced teacher-notes.tsx with edit/delete functionality:
  * NoteItem component with hover action buttons (Pencil + Trash2 icons)
  * Edit dialog with Textarea, pre-filled content, loading state, toast notifications
  * Delete with AlertDialog confirmation (red accent), loading state
  * Better filter UX with X icon on "Rimuovi filtro" badge
- Enhanced teacher-dashboard.tsx student rows:
  * Added correctedCount and lastEssayDate to student data computation
  * Mini progress bar showing corrected/total essay ratio (animated, color-coded)
  * Last essay date display instead of just enrollment date
  * "Nessun saggio" for students with no essays
- All components verified working: lint passes, dev server compiles correctly
- Git committed: feat: add teacher/admin dashboards with recharts, note CRUD, and progress indicators

Stage Summary:
- stats-charts.tsx rewritten with recharts (LineChart, BarChart, PieChart) via shadcn/ui ChartContainer
- Note CRUD complete: create (existing), edit (new PUT API + dialog), delete (new DELETE API + AlertDialog)
- Teacher dashboard enhanced with progress bars and last essay date per student
- All admin APIs verified: GET /api/admin/users, POST /api/admin/approve-teacher, POST /api/admin/suspend-user
- All components: teacher-dashboard, student-detail, teacher-notes, class-preparations, admin-dashboard, stats-charts verified
