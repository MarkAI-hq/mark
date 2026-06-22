# Contributing to Mark

## Branching

Base all branches off `main`. Use these prefixes:

| Pattern | When to use |
|---|---|
| `feat/<ticket-or-desc>` | New feature |
| `fix/<ticket-or-desc>` | Bug fix |
| `chore/<desc>` | Tooling, deps, config |
| `docs/<desc>` | Documentation only |
| `refactor/<desc>` | Refactor without behaviour change |

## Commit messages

Use a prefix on every commit:

```
feat: add exam builder section config UI
fix: resolve teacher redirect loop on token refresh
chore: upgrade next to 15.3
docs: update README quick start
```

## Pre-open PR checklist

Before opening a pull request, verify:

- [ ] `pnpm lint` passes with no errors
- [ ] API calls use Server Actions in `src/lib/actions/` — no direct `fetch()` to mark-api from client components
- [ ] Every mutation uses `useTransition`, not `useState` for loading state
- [ ] Every failure path shows `toast.error(...)` — never fail silently
- [ ] New routes are accounted for in `src/middleware.ts` (role access enforcement)
- [ ] `.env.example` updated if new `NEXT_PUBLIC_*` variables were added
- [ ] New `ServerActionResponse<T>` shapes match the mark-api response — check the Swagger docs

## Adding a page

Follow the server/client split convention:

```
app/(dashboard)/dashboard/<feature>/
  page.tsx                          ← server component, fetches data
  _components/
    <feature>-client.tsx            ← client component, handles interactions
    <feature>-form.tsx              ← form if needed (react-hook-form + zod)

src/lib/actions/<feature>.ts        ← Server Actions ('use server')
```

UI conventions (see `.claude/frontend.md`):
- Use `shadcn/ui` primitives from `src/components/ui/` — never modify these files
- Icons: `lucide-react` only
- Conditional classes: `cn()` from `@/lib/utils`
- Toasts: `sonner` (`toast.success`, `toast.error`)
- Dates: `date-fns` only — never `toLocaleDateString()`

## No automated test suite

There is no Jest/Playwright suite. Verify changes manually:

1. `pnpm dev`
2. Test the golden path (happy path)
3. Test the empty state (no data)
4. Test error handling (what happens when the action fails)
5. Test role boundaries — confirm other roles cannot access the feature

## Dual-repo features

Features almost always touch both `mark` (this repo) and `mark-api` (backend at `D:\markhq\mark-api`). When this is the case:

1. Open a PR in each repo and link them to each other in the description
2. Merge `mark-api` first, then `mark`
3. Use the same commit message prefix in both repos for traceability

## Running locally

See [README.md](README.md) for the full local setup guide.
