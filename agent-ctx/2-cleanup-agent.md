# Task 2 - Dead Code & Dependency Cleanup

## Work Summary

### 1. Removed unused npm dependencies (26 packages removed)
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — drag-and-drop not used
- `@google/genai` — using z-ai-web-dev-sdk REST API instead
- `@hookform/resolvers` — not imported anywhere
- `@mdxeditor/editor` — very heavy (~2MB), not used
- `@prisma/client` — using Supabase instead
- `next-auth` — using custom JWT auth
- `next-intl` — not used
- `react-syntax-highlighter` — very heavy, not used
- `react-markdown` — not used
- `uuid` — not used
- `@tanstack/react-table` — not used
- `sharp` — very heavy, not used
- `date-fns` — not used
- `@reactuses/core` — not used
- `prisma` (devDependency) — using Supabase instead
- Removed unused Radix UI packages: `react-accordion`, `react-aspect-ratio`, `react-context-menu`, `react-dropdown-menu`, `react-hover-card`, `react-menubar`, `react-navigation-menu`, `react-radio-group`, `react-toggle-group`

### 2. Removed stale Prisma setup
- Deleted `/prisma/schema.prisma` (had User/Post models — completely stale)
- Deleted `/db/` directory (stale SQLite database)
- Removed `db:push`, `db:generate`, `db:migrate`, `db:reset` scripts from package.json

### 3. Removed empty directories
- Deleted `/mini-services/` (only contained `.gitkeep`)
- `/upload/` could not be removed (device busy / mount point) — left as-is

### 4. Removed 19 unused shadcn/ui components
Verified each with grep — none are imported in `src/app/` or `src/components/scribia/`:
- accordion.tsx, aspect-ratio.tsx, breadcrumb.tsx, calendar.tsx, carousel.tsx
- command.tsx, context-menu.tsx, drawer.tsx, dropdown-menu.tsx, form.tsx
- hover-card.tsx, input-otp.tsx, menubar.tsx, navigation-menu.tsx, pagination.tsx
- radio-group.tsx, resizable.tsx, skeleton.tsx, toggle-group.tsx

### 5. Added `.vercelignore`
Created with `skills/` and `examples/` entries to exclude from Vercel deployment.

### 6. Fixed next.config.ts and start script
- `next.config.ts` was already minimal (no `output: 'standalone'` to remove)
- Changed start script from `NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log` to `next start`

### Verification
- `bun install` — 26 packages removed, lockfile updated
- `bun run lint` — passes cleanly with zero errors
- Dev server running normally
