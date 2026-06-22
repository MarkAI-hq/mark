# Frontend Architecture

## Data flow

```
Browser
  │
  ├─ Next.js middleware (edge)
  │    reads `user` cookie → enforces route access by role
  │    redirects to /login if unauthenticated
  │
  ├─ Server Component (page.tsx)
  │    calls Server Action to fetch initial data
  │    passes data as props to client components
  │
  ├─ Client Component (_components/*.tsx)
  │    calls Server Actions on user interaction (useTransition)
  │    never calls mark-api directly
  │
  └─ Server Action (src/lib/actions/*.ts)
       calls fetcher<T>() (server-side only)
         reads `token` httpOnly cookie via next/headers
         makes HTTP request to mark-api
         returns ServerActionResponse<T> → { data, error }
```

The single exception: `src/app/api/tracy/route.ts` is a Route Handler that proxies Tracy AI chat streams, re-attaching the user's JWT before forwarding to `TRACY_URL`.

## Route groups → roles

| Route group | Allowed roles | Entry point |
|---|---|---|
| `(auth)/` | Unauthenticated | `/login`, `/register` |
| `(dashboard)/dashboard/` | Admin | `/dashboard` |
| `(dashboard)/dashboard/teacher/` | Teacher | `/dashboard/teacher` |
| `(onboarding)/` | New Admin (first-time setup) | `/onboarding` |
| `student/(portal)/` | Student | `/student/dashboard` |
| `(root)/root/` | Root, Support | `/root` |
| `record/[id]` | Public (no auth) | — |

Middleware (`src/middleware.ts`) enforces these at the Cloudflare/Vercel edge by reading the `user` cookie. It does not call mark-api — it trusts the cookie for routing decisions only. mark-api re-validates the JWT on every request.

## Auth flow

```
1. User submits login form
2. Server Action calls POST /api/v1/auth/login on mark-api
3. mark-api sets three cookies in the response:
   - token (httpOnly, 15 min) — access token
   - refreshToken (httpOnly, 7 days) — refresh token
   - user (non-httpOnly, 7 days) — { id, role, org, ... }
4. Middleware reads `user` cookie on subsequent requests to determine role
5. Server Actions read `token` cookie server-side via next/headers
6. When token expires: middleware calls refreshAccessToken() Server Action
   - exchanges refreshToken for a new token
   - if refresh fails → redirect to /login?return_url=<current path>
```

## State management

| Concern | Solution |
|---|---|
| Current user (global) | `userSignal` in `src/signals/auth.ts` via `@preact/signals-react` |
| Form state | `react-hook-form` + `zod` (for forms with 2+ fields) |
| Async mutations | `useTransition` calling a Server Action |
| Loading state | `useTransition`'s `isPending` — never `useState(isLoading)` |
| Server data | Props passed from Server Components — no client-side data fetching |

## Key shared abstractions

| Abstraction | Location | Purpose |
|---|---|---|
| `ServerActionResponse<T>` | `src/lib/types.ts` | Return type of every Server Action: `{ data: T \| null, error: { message, status } \| null }` |
| `fetcher<T>()` | `src/lib/fetch.ts` | Single HTTP client — reads JWT cookie, calls mark-api, normalises response envelope |
| `cn()` | `src/lib/utils.ts` | Conditional className merging (clsx + tailwind-merge) |
| `userSignal` | `src/signals/auth.ts` | Global reactive user state for client components |

## UI system

- **Component library:** shadcn/ui (Radix UI primitives + Tailwind). All primitives live in `src/components/ui/` — never modify these files directly; re-generate via `shadcn` CLI.
- **Icons:** `lucide-react` only
- **Theme:** `next-themes` (light/dark mode)
- **Toasts:** `sonner` — use `toast.success()` and `toast.error()` consistently
- **Key colour tokens:** `text-gold` (#c9a84c), semantic colours (emerald/amber/red for status)
- **Root console:** distinct dark palette with inline styles (`#08080f` background) — different from the dashboard design system
- **Date formatting:** `date-fns` only — never `toLocaleDateString()`

## PWA

Configured via `@ducanh2912/next-pwa`. Disabled in development (`NODE_ENV !== 'production'`). Service worker is generated at build time.

## Production build

`next build` produces a **standalone** output (`output: 'standalone'` in `next.config.ts`). This bundles the server into a self-contained directory suitable for containerised deployments — no `node_modules` install needed in the container.
