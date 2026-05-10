# Task 3 — Extract Shared Utilities and Fix Duplicate Code

## Agent: Code Refactoring Agent

## Summary
All 5 subtasks completed successfully. Lint passes with zero errors.

## Changes Made

### 1. Created `/src/lib/utils-user.ts`
- `sanitizeUser(user: User): Omit<User, 'passwordHash'>` — removes passwordHash from user object
- `generateTeacherCode(): string` — generates 6-char uppercase alphanumeric code

### 2. Replaced `sanitizeUser()` in 3 API routes
- `src/app/api/auth/login/route.ts` — removed inline def, added import from `@/lib/utils-user`, removed unused `type User`
- `src/app/api/auth/register/route.ts` — removed inline def, added import from `@/lib/utils-user`
- `src/app/api/auth/me/route.ts` — removed inline def, added import from `@/lib/utils-user`, removed unused `type User`

### 3. Replaced `generateTeacherCode()` in 3 API routes
- `src/app/api/auth/register/route.ts` — already handled above
- `src/app/api/admin/approve-teacher/route.ts` — removed inline def, added import
- `src/app/api/generate-teacher-code/route.ts` — removed inline def, added import, removed unused `type User`

### 4. Fixed duplicate `CorrectionError` interfaces in 4 components
Each component now imports `CorrectionError` base type from `@/lib/ai-correction.types` and derives its local type using `Pick` + additional fields:
- `src/components/scribia/profile-section.tsx`
- `src/components/scribia/class-preparations.tsx`
- `src/components/scribia/student-detail.tsx` (also imports `ErrorType`)
- `src/components/scribia/stats-charts.tsx`

### 5. Removed dead code in `src/app/api/essays/route.ts`
- Removed `db.user.findMany({ where: { id: uniqueStudentIds[0] } })` call whose result (`students`) was never used

### 6. Fixed unused imports
- `src/app/api/generate-teacher-code/route.ts` — removed `type User` (done as part of step 3)
- `src/app/api/preparations/route.ts` — removed `type ClassPreparation`

## Verification
- `bun run lint` passes with zero errors
