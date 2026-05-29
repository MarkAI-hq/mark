# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # start dev server (webpack mode, http://localhost:3000)
pnpm build      # production build (standalone output)
pnpm lint       # ESLint via next lint
```

There is no test suite configured.

## Related repositories

| Repo | Path | Role |
|---|---|---|
| **mark-api** | `D:\markhq\mark-api` | NestJS backend — all REST API endpoints this frontend calls via `fetcher` |
| **tracy** | `D:\markhq\tracy` | Tracy AI chat service — proxied by `src/app/api/tracy/route.ts` |

## Environment variables

| Variable | Used by |
|---|---|
| `API_BASE_URL` | Server-side only (Server Actions, Route Handlers) |
| `NEXT_PUBLIC_API_URL` | Client-side browser requests |
| `TRACY_URL` | Tracy AI proxy (`/api/tracy` route, default `http://localhost:4001`) |

See `.env.example` for optional Sentry/PostHog keys.

## Architecture overview

**Mark** is an educational assessment platform — Next.js 15 (App Router) + React 19, talking to an external **NestJS backend** (not in this repo).

### Route groups → user roles

```
(auth)/          → login, register, verify-email, etc.
(dashboard)/     → Admin + Teacher workspace
  /dashboard/teacher/... → Teacher-scoped views
(onboarding)/    → first-time Admin setup wizard
student/(portal) → Student portal
record/[id]      → public student record (no auth)
```

Middleware (`src/middleware.ts`) enforces role-based access at the edge:
- **Admin** lands at `/dashboard`, blocked from `/dashboard/teacher/*`
- **Teacher** lands at `/dashboard/teacher`, blocked from settings/class management routes
- **Student** lands at `/student/dashboard`, blocked from `/dashboard/*`
- Unauthenticated requests redirect to `/login` or `/student/login` with `?return_url`

### Data layer

All backend calls go through `src/lib/fetch.ts` → `fetcher<T>(endpoint, init)`. It auto-attaches the JWT from cookies and normalises the NestJS `{ data, message, error }` envelope into `ServerActionResponse<T>`:

```ts
type ServerActionResponse<T> = {
  data: T | null;
  error: { message: string; status?: number } | null;
}
```

Every file in `src/lib/actions/` is a Next.js Server Action (`'use server'`) that calls `fetcher`. Client components call these actions directly — there is no client-side `fetch` to the backend except through the `/api/*` Route Handlers.

### Auth

JWT stored in three cookies set by `src/lib/actions/auth.ts`:
- `token` (httpOnly, 15 min) — access token
- `refreshToken` (httpOnly, 7 days)
- `user` (non-httpOnly, 7 days) — serialised `User` object for middleware + client reads

Client-side current user is held in `src/signals/auth.ts` (`userSignal`) via `@preact/signals-react`.

### Key feature areas

**Examination Centre** (`/dashboard/exam-builder/*`)
- AI-driven exam generation with curriculum archetypes, Bloom's taxonomy distribution, section configs
- Relevant types: `GenerateExamPayload`, `SectionConfig`, `ExamBuilderAssessment` in `src/lib/types.ts`
- Server actions: `src/lib/actions/exam-builder.ts`, `src/lib/actions/assessments.ts`

**MirrorEditor** (`src/components/editor/`)
- TipTap rich-text editor for reviewing AI redesign suggestions on assessments
- Renders an `AssessmentDiff` (insertions/deletions/image suggestions) as highlighted marks
- `InsertionMark` / `DeletionMark` are custom TipTap extensions; `useSuggestions` / `useApplyDiff` are the state hooks
- Exposes `MirrorEditorHandle` ref with `getHTML()` and `getAcceptedImages()`

**Tracy** (`/dashboard/tracy`)
- AI chat assistant proxied through `src/app/api/tracy/route.ts` → external `TRACY_URL` service
- The route handler re-attaches the user JWT before forwarding

**Dashboard nav** (`src/config/dashboard.ts`)
- `dashboardConfig.mainNav` drives sidebar rendering; each item declares which `roles` can see it and optional `roleHref` per role

### UI conventions

- Component library: **shadcn/ui** (Radix UI primitives + Tailwind). Components live in `src/components/ui/`.
- Icons: `lucide-react` and `@tabler/icons-react`
- Theming: `next-themes`
- Toast: `sonner`
- Forms: `react-hook-form` + `zod`

### Infrastructure

- PWA via `@ducanh2912/next-pwa` (disabled in development)
- Sentry error monitoring loaded only in production builds (see `next.config.ts`)
- PostHog analytics (`posthog-js` / `posthog-node`)
- Images served from Cloudflare R2 (`**.cloudflarestorage.com`)
- `next build` produces a **standalone** output for containerised deployments
