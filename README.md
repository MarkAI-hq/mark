# Mark

Next.js 15 PWA for the Mark educational assessment platform. Multi-role UI serving Admins, Teachers, Students, and Root/Support platform operators.

Built with Next.js 15 (App Router) · React 19 · TypeScript · shadcn/ui · Tailwind CSS.

## Prerequisites

- Node.js 22
- pnpm 10
- A running [mark-api](../mark-api) instance

## Quick start

```bash
# 1. Clone and install
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Set at minimum: NEXT_PUBLIC_API_URL and API_BASE_URL

# 3. Start dev server
pnpm dev
# → http://localhost:3000
```

## Environment variables

| Variable | Exposure | Required | Description |
|---|---|---|---|
| `API_BASE_URL` | Server-side only | Yes | mark-api base URL for Server Actions and Route Handlers (never sent to the browser) |
| `NEXT_PUBLIC_API_URL` | Client-side | Yes | mark-api base URL for browser requests |
| `TRACY_URL` | Server-side only | No | Tracy AI service URL (default: `http://localhost:4001`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client-side | No | Google OAuth client ID (SSO login button) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side | No | Sentry DSN for client-side error monitoring |
| `SENTRY_AUTH_TOKEN` | Build-time | No | Sentry source map upload token |
| `NEXT_PUBLIC_POSTHOG_KEY` | Client-side | No | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client-side | No | PostHog host (default: `https://app.posthog.com`) |

## Architecture in 60 seconds

**All API calls go through Server Actions — no direct client-side fetch to the backend.**

```
Browser
  → Next.js middleware (edge, reads JWT cookies, enforces role access)
    → Server Component (passes data as props)
      → Server Action in src/lib/actions/*.ts
        → fetcher<T>() in src/lib/fetch.ts
          → mark-api (NestJS)
```

**Auth:** JWT stored in three cookies set by mark-api:
- `token` — httpOnly, 15-minute access token (never readable by JS)
- `refreshToken` — httpOnly, 7-day refresh token
- `user` — readable by JS, 7-day serialised user object (middleware reads role at the edge)

**Route groups → roles:**

| Route group | Roles | Landing page |
|---|---|---|
| `(auth)/` | Unauthenticated | `/login` |
| `(dashboard)/dashboard/` | Admin | `/dashboard` |
| `(dashboard)/dashboard/teacher/` | Teacher | `/dashboard/teacher` |
| `(onboarding)/` | New Admin | `/onboarding` |
| `student/(portal)/` | Student | `/student/dashboard` |
| `(root)/root/` | Root, Support | `/root` |
| `record/[id]` | Public | — |

## Feature map

| Feature | Route | Key files |
|---|---|---|
| Examination Centre | `/dashboard/exam-builder/*` | `src/lib/actions/exam-builder.ts` |
| MirrorEditor (AI assessment review) | `/dashboard/assessments/[id]/review` | `src/components/editor/` |
| Tracy AI Chat | `/dashboard/tracy` | `src/app/api/tracy/route.ts` |
| Class management | `/dashboard/classes/*` | `src/lib/actions/classes.ts` |
| Student portal | `/student/*` | `src/app/student/` |
| Root console | `/root/*` | `src/app/(root)/` |
| Attendance | `/dashboard/attendance/*` | `src/lib/actions/attendance.ts` |
| Study plans | `/dashboard/study-plans/*` | `src/lib/actions/study-plans.ts` |

## Key commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server at `http://localhost:3000` |
| `pnpm build` | Production build (standalone output) |
| `pnpm lint` | ESLint via `next lint` |

## Related repos

| Repo | Path | Role |
|---|---|---|
| **mark-api** | `D:\markhq\mark-api` | NestJS backend — all REST endpoints |
| **tracy** | `D:\markhq\tracy` | AI chat service proxied by `/api/tracy` |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow.
