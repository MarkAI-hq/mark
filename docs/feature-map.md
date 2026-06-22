# Feature Map

An index of Mark frontend features: routes, Server Actions, and key components.

## Examination Centre

**What it does:** Admin/Teacher configures and generates AI-driven exams aligned to curriculum archetypes and Bloom's taxonomy.

| Item | Detail |
|---|---|
| Routes | `/dashboard/exam-builder/*` |
| Server Actions | `src/lib/actions/exam-builder.ts` |
| Key components | `src/app/(dashboard)/dashboard/exam-builder/` |
| Notes | Async generation — frontend polls for job completion |

## MirrorEditor (Assessment Audit)

**What it does:** Teacher reviews AI-generated redesign suggestions for an uploaded assessment. Accepts or rejects insertions, deletions, and image swaps inline.

| Item | Detail |
|---|---|
| Routes | `/dashboard/assessments/[id]/review` |
| Server Actions | `src/lib/actions/assessments.ts` |
| Key components | `src/components/editor/` (TipTap-based) |
| Key hooks | `useSuggestions`, `useApplyDiff` |
| Ref handle | `MirrorEditorHandle` — exposes `getHTML()` and `getAcceptedImages()` |
| Custom TipTap extensions | `InsertionMark`, `DeletionMark` |

## Tracy AI Chat

**What it does:** In-app AI chat assistant. Streams responses from the Tracy service.

| Item | Detail |
|---|---|
| Routes | `/dashboard/tracy` |
| Route Handler | `src/app/api/tracy/route.ts` (proxies to `TRACY_URL`) |
| Notes | JWT is re-attached before forwarding; uses streaming response |

## Class Management

**What it does:** Admin/Teacher creates and manages classes, adds/removes students, views class rosters.

| Item | Detail |
|---|---|
| Routes | `/dashboard/classes/*` |
| Server Actions | `src/lib/actions/classes.ts` |
| Key component | `src/app/(dashboard)/dashboard/classes/[id]/_components/class-students-tab.tsx` |

## Student Portal

**What it does:** Separate shell for students — different auth (school_code + PIN), different layout, different data.

| Item | Detail |
|---|---|
| Routes | `/student/*` |
| Login | `/student/login` |
| Server Actions | `src/lib/actions/students.ts`, `src/lib/actions/study-plans.ts` |
| Key pages | Dashboard, results, study plans, certificates |
| Notes | Middleware blocks students from `/dashboard/*` |

## Attendance

**What it does:** Teacher records daily attendance per class. Dashboard highlights at-risk students.

| Item | Detail |
|---|---|
| Routes | `/dashboard/attendance/*` |
| Server Actions | `src/lib/actions/attendance.ts` |

## Study Plans

**What it does:** Student-facing AI-generated personalised study plans.

| Item | Detail |
|---|---|
| Routes | `/dashboard/study-plans/*`, `/student/study-plans/*` |
| Server Actions | `src/lib/actions/study-plans.ts` |

## Scheme of Work

**What it does:** AI-generated scheme of work for a term, aligned to curriculum.

| Item | Detail |
|---|---|
| Routes | `/dashboard/scheme-of-work/*` |
| Server Actions | `src/lib/actions/scheme-of-work.ts` (if present) |

## Analytics

**What it does:** School and class performance dashboards — assessment scores, grading trends, at-risk student flags.

| Item | Detail |
|---|---|
| Routes | `/dashboard/analytics/*` (or embedded in dashboard home) |
| Server Actions | `src/lib/actions/analytics.ts` |

## Root / Support Console

**What it does:** Platform operator views — school management, subscription oversight, user lookup. Dark-palette UI distinct from the main dashboard.

| Item | Detail |
|---|---|
| Routes | `/root/*` |
| Key config | `src/config/root.ts` — nav items with `rootOnly` flag |
| Notes | Admin/Teacher users are blocked from this route group by middleware |

## Dashboard Navigation

**What it does:** Sidebar navigation rendered from a config file, with role-based visibility.

| Item | Detail |
|---|---|
| Config | `src/config/dashboard.ts` — `dashboardConfig.mainNav` |
| Structure | Each item declares `roles[]` (who can see it) and optional `roleHref` per role |

## Onboarding

**What it does:** First-time Admin setup wizard — org name, branding, initial subjects, first class.

| Item | Detail |
|---|---|
| Routes | `/onboarding/*` |
| Key component | `src/components/onboarding/onboarding-wizard.tsx` |
