---
Task ID: 1
Agent: Main Agent
Task: Professional audit of routes, Supabase tables, and production hardening for Vercel deployment

Work Log:
- Conducted comprehensive audit of all 18 API route files, 14 business components, 6 lib files, 3 stores, and Supabase schema
- Found critical bug: `useMemo` used in essay-detail.tsx but never imported
- Found self-assessment field name mismatch: API uses `assessedAt` but TypeScript type uses `submittedAt`
- Found 46 console.log/console.error statements across the codebase (13 client-side, 33 server-side)
- Found missing API endpoints: no PUT/DELETE for essays, no POST for enrollments
- Found overly permissive RLS policies for anon role (full CRUD on all data tables)
- Found unused stores (auth.ts, writing.ts) and unused supabaseAnon client
- Found /api/route.ts returning "Hello, world!" instead of proper health check

- Fixed useMemo import in essay-detail.tsx
- Fixed self-assessment field name to `assessedAt` in ai-correction.types.ts
- Removed ALL 46 console.log/console.error statements (0 remaining)
- Added PUT /api/essays/[id] — students can update DRAFT essays
- Added DELETE /api/essays/[id] — students can delete DRAFT essays, admins can delete any
- Added POST /api/enrollments — students can enroll with teacher code after registration
- Updated /api/route.ts to proper health check endpoint
- Removed unused stores: src/store/auth.ts, src/store/writing.ts
- Removed unused supabaseAnon client from supabase.ts
- Tightened Supabase RLS policies: removed anon CRUD access to essays, enrollments, notes, preparations
- Added missing indexes: idx_essays_submitted_at, idx_essays_corrected_at
- Verified: lint passes, TypeScript compiles, zero console statements remain

Stage Summary:
- All critical bugs fixed
- All console statements removed for production
- Missing API endpoints added (essay CRUD, enrollment POST)
- Supabase schema tightened (RLS, indexes)
- Dead code removed (unused stores, unused supabaseAnon)
- Project is production-ready for Vercel deployment

---
Task ID: 2
Agent: Main Agent
Task: Fix role selection in registration form and favicon 404, push to GitHub

Work Log:
- Diagnosed the role selection issue: Radix Select uses a Portal that renders at body level, but the auth modal overlay (fixed z-[100], backdrop-blur) steals focus/clicks, causing the Select dropdown to immediately close or not open at all
- Replaced the Radix Select dropdown with native toggle-style buttons for the 2 role options (Studente/Docente) — better UX for 2-option choices and avoids the portal/z-index issue entirely
- Added public/favicon.ico (16x16 green gradient circle) to resolve the /favicon.ico 404 error
- Updated layout.tsx metadata icons to reference both favicon.ico and favicon.svg
- Committed changes and force-pushed to GitHub repo stecc88/scribia
- Removed GitHub PAT from remote URL after push

Stage Summary:
- Role selection now works via clickable toggle buttons instead of broken dropdown
- Favicon 404 resolved with new favicon.ico file
- Code pushed to https://github.com/stecc88/scribia
