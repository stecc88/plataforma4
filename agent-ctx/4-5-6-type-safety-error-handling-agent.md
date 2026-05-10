# Task 4-5-6: Type Safety & Error Handling Fix

## Agent: type-safety-error-handling-agent

## Summary

Fixed a critical data bug in stats-charts, corrected Spanish error messages to Italian across API routes, and significantly improved AI error handling with timeout mechanism and typed error classes.

## Changes Made

### 1. stats-charts.tsx — Fixed MONTH_LABELS Bug

**Bug**: `MONTH_LABELS[String(count)]` was using the count of essays in a month as the lookup key for Italian month abbreviations. This caused incorrect month labels (e.g., if 3 essays were in March, it would show "Mar" by coincidence, but if 15 essays were in January, it would show "15" as the label).

**Fix**: Extract the month number from the composite key `"2024-3"` using `key.split('-')[1]`, then look up `MONTH_LABELS[monthNum]`.

### 2. auth/login/route.ts — Fixed Spanish Error Messages

- `'Cuenta pendiente de aprobación'` → `'Account in attesa di approvazione'`
- `'Cuenta suspendida'` → `'Account sospeso'`

### 3. essays/[id]/correct/route.ts — Fixed Spanish + Added Timeout Handling

- `'Error en la corrección AI. Intenta de nuevo.'` → `'Errore nella correzione AI. Riprova.'` (3 instances)
- Added `AITimeoutError` import and specific 504 response for timeout
- Simplified: removed redundant inner try/catch for AI calls

### 4. ai.ts — Complete Rewrite of Error Handling

**Before**: AI functions caught all errors internally and returned fallback objects with `score: 0` and empty data. This meant failed corrections were saved as "CORRECTED" in the database with score 0 — misleading students.

**After**:
- Added `AITimeoutError` class (extends Error) — thrown when AI calls exceed 60s timeout
- Added `AIResponseError` class (extends Error) — thrown for invalid AI responses
- Added `withTimeout()` helper using Promise.race pattern (60s default)
- Added `extractJSON()` helper — DRY refactoring of markdown code block extraction
- Functions now **throw** errors instead of returning fallbacks, allowing API routes to provide proper error responses
- Improved console.error: logs `error.message` instead of full error object
- Better JSON parsing: separate try/catch with typed `AIResponseError`

### 5. preparations/generate/route.ts — Added Timeout Handling

- Added `AITimeoutError` import
- Added specific 504 response for timeout
- Removed redundant inner try/catch for AI calls

## Files Modified

1. `src/components/scribia/stats-charts.tsx` — Fixed MONTH_LABELS bug
2. `src/app/api/auth/login/route.ts` — Spanish → Italian error messages
3. `src/app/api/essays/[id]/correct/route.ts` — Spanish → Italian + timeout handling
4. `src/lib/ai.ts` — Complete rewrite with timeout, typed errors, throw-instead-of-fallback
5. `src/app/api/preparations/generate/route.ts` — Timeout handling

## Verification

- `bun run lint` passes with zero errors
- Dev server compiles and serves correctly
- All 16 API route files verified for proper error handling patterns
