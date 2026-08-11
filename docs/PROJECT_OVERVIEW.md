# OnboardingBuddy — Project Overview

## What this is

OnboardingBuddy is a mobile-first web app that gives every new Akij Resource
employee a guided, self-service **180-day onboarding journey**: a 50-task
checklist split across 30/60/90-day phases, milestone assessments, a growth
review, dynamic HR/IT/Manager/Buddy contacts, a manager-facing team view, and
an AI Assistant that answers both onboarding questions and (as of the latest
expansion) PeopleDesk ERP usage questions.

It is **not** the company's HR/ERP system of record — that is **PeopleDesk**
(a separate mobile app/website). OnboardingBuddy reads employee master data
from PeopleDesk at login and otherwise operates as its own lightweight
product on top of Supabase.

- **Production URL**: https://onboardingbuddy.vercel.app
- **Primary users**: new employees (0–180 days tenure), their reporting
  managers (Team tab), implicitly HR/People & Culture (via contact routing
  and the help-ticket flow)

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React Server Components) |
| UI | React 19, Tailwind CSS v4, custom design system ported from a Figma/HTML prototype |
| Fonts | Manrope (Latin) + Hind Siliguri (Bangla), via `next/font/google` |
| Database | Supabase Postgres, with Row-Level Security on every table |
| Auth | Supabase Auth (email/password), with a synthetic-email scheme so employees log in with just an enroll number + password |
| Hosting | Vercel (serverless/edge functions + static assets) |
| External integration | PeopleDesk HR API (single-employee lookup, read-only) |
| AI Assistant | No external LLM — a local, no-API-key, bag-of-words/IDF-weighted matcher (see below) |

## Repository structure

```
app/
  layout.tsx               Root layout: fonts, PhoneFrame shell
  page.tsx                 Splash screen
  login/                   Login (enroll number + password)
  forgot-password/         Password reset
  (app)/                   Authenticated route group
    layout.tsx             Session guard, shared data fetch, OverlayProvider, BottomNav
    home/                  Home dashboard
    journey/                50-task checklist entry point
    assistant/              AI Assistant chat
    profile/                 Employee profile + badges + sign out
    team/                    Manager Portal: subordinate list
    team/[enrollNumber]/     Manager Portal: subordinate detail

components/
  assistant/     Chat UI (ChatClient)
  auth/          Login/forgot-password forms
  icons/         Custom SVG icon system (Icon component + icon-paths.ts)
  journey/       Milestone cards, HR Services grid, OverlayProvider (global overlay stack + optimistic state)
  layout/        PhoneFrame, BottomNav
  mascot/        Animated mascot SVG generator
  overlays/      FullTaskListOverlay, PhaseViewOverlay, TaskManualOverlay, AssessmentOverlay,
                 GrowthReviewOverlay, HelpRequestOverlay, ContactSheet, ContactListSheet, OverlayShell
  team/          ManagerFeedbackForm, BuddyAssignForm
  ui/            Toast, SuccessModal, PageSkeleton (loading state)

actions/         Server actions: auth, tasks, assessments, milestone-assessments,
                 help, manager, sign-out, password-reset

lib/
  supabase/      client.ts (browser), server.ts (RSC/server actions), admin.ts (service-role), types.ts (generated DB types)
  data/queries.ts  React.cache()-wrapped shared Supabase queries (dedupes layout/page fetches per request)
  auth/credentials.ts  Synthetic-email derivation for enroll-number login
  peopledesk.ts    PeopleDesk API client
  business-rules.ts  Pure functions: progress %, current phase, growth-unlock, assessment-submit gating
  sbu-matching.ts   SBU name reconciliation (alias-based fuzzy match) for dynamic HR/IT contact routing
  contact-lists.ts  Builds company-wide HR/IT contact list from sbu_hr_assignments
  contact-actions.ts  tel:/wa.me/mailto: helpers for functional Call/WhatsApp/Message buttons
  assistant-kb.ts   AI Assistant matching engine (see below)
  bn.ts            Bangla numeral conversion helper
  types.ts         App-level (non-DB) TypeScript types

docs/            Generated reference documents (Task Q&A workbook, this overview, the spec)
reference/       Original design prototype, BRS, and PeopleDesk source material
```

## Data model (Supabase, `public` schema — 17 tables, RLS on all)

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`; enroll number + full name + `is_hr_admin` flag (unused so far) |
| `employees` | PeopleDesk-sourced master data snapshot: SBU, department, designation, manager, buddy, email, phone |
| `onboarding_tasks` | The 50-task checklist content (title, responsible role, timeline, why, how-to steps, confirm question) |
| `employee_task_status` | Per-employee completion state for each task |
| `assessment_templates` | 30/60/90/180 rating-assessment item lists |
| `employee_assessments` | Per-employee ratings, employee comment, manager feedback, final status |
| `milestone_assessment_templates` / `milestone_assessments` | The mandatory Team/Section identity + yes/no questions tab added to 30/60/90 assessments |
| `badges` / `employee_badges` | Motivational badge unlock system (computed on read, not persisted for most badges) |
| `contacts` | Generic HR/IT/Manager/Buddy/Training/Dept contact fallback rows |
| `sbu_hr_assignments` | 48-row reconciled SBU → HR Cluster Head/HRBP/HR SS/IT Head mapping, used to dynamically resolve the right contact per employee's real SBU |
| `sbu_options` | Legacy login-form SBU dropdown data (largely vestigial — SBU now comes from PeopleDesk directly) |
| `assistant_kb` | Small hand-curated generic KB (Role/JD, System Access, Policy, Buddy, KPI, 30/60/90/180, Help) |
| `peopledesk_kb` | 96-row PeopleDesk ERP knowledge base (FAQ + derived how-to + workflow/approval + reference entries), English/Bangla/Banglish |
| `help_requests` | Help/grievance tickets raised from the app |
| `audit_log` | Provisioned but not yet actively written to |

**Helper functions** (SECURITY DEFINER, used by RLS policies and manager actions):
`current_enroll_number()`, `is_hr_admin()`, `is_manager()`, `is_manager_of(target_enroll)`,
`manager_set_buddy(...)`, `manager_set_feedback(...)`.

## Auth model

Employees log in with just an **enroll number + password** — no email is ever
shown to the user. Under the hood, a deterministic synthetic email
(`{enrollNumber}@onboardingbuddy.internal`) is minted server-side and used
with Supabase's standard email/password auth. On first login, the enroll
number is validated against the live PeopleDesk API; if valid, an
`employees` + `profiles` row is auto-provisioned from PeopleDesk's returned
data and the typed password becomes the account's permanent password.
Existing accounts skip the PeopleDesk call entirely (fast path).

## Business rules (pure functions, `lib/business-rules.ts`)

- **Progress %** = completed tasks / 50, rounded.
- **Current phase** = earliest of 30/60/90 not yet fully complete, else "180".
- **Growth Review unlock** = all 50 tasks done **and** all three of 30/60/90's
  rating assessment **and** milestone questionnaire are submitted.
- **Assessment submittable** = every rating item has a value.

## AI Assistant — matching design (no LLM)

Two independent local matchers run in sequence, each falling through to the
next on no confident match, ending in a small generic KB and finally a
canned fallback message:

1. **Onboarding-task matcher** (`matchTaskAnswer`) — two-pass: identify which
   of the 50 tasks the question is about (title/role word overlap), then
   which angle (why/how/who/deadline/confirm) via intent keyword sets; falls
   back to a combined summary when the angle isn't clear.
2. **PeopleDesk matcher** (`matchPeopleDeskAnswer`) — IDF-weighted
   bag-of-words match against the 96-row `peopledesk_kb`, pooling each
   entry's English + Bangla + Banglish question text into one keyword bag.
   Common/filler words (English business filler + Banglish grammar
   particles) are stripped so they can't falsely dominate a match; rare,
   topic-specific words carry much more weight.
3. **Generic KB** (`matchGenericKb`) — substring match against the original
   10-entry hand-curated table (Role/JD, System Access, Policy, Buddy, KPI,
   30/60/90/180, Help), also used by the quick-question chips.

All matching happens client-side in the already-loaded page data — no
network round-trip per message, no external API, no per-message cost.
**Known ceiling**: it cannot infer implied intent (e.g. "I don't want to go
to office" → "apply for leave") since that requires real language
understanding, not keyword overlap. This is a known, accepted tradeoff (an
LLM-backed upgrade path was scoped but deliberately not taken).

## Manager Portal

A conditional 5th bottom-nav tab ("Team"), shown only when
`is_manager()` returns true for the logged-in account — determined by
matching the employee's own PeopleDesk email against other employees'
`reporting_manager_email`. Managers can see subordinates' task progress and
assessment results, leave manager-authored feedback (separate from the
employee's own self-comment), and assign a Buddy — all gated by
SECURITY DEFINER RLS helper functions so a manager can only ever touch their
actual direct reports' data.

## Deployment

- **Hosting**: Vercel project `onboardingbuddy`, deployed via `npx vercel
  deploy --prod --yes` (manual CLI, not yet CI-connected — see the spec's
  bottleneck/alternatives section).
- **Database**: Supabase project `wxazzkcwevsqqifglysc` (ap-southeast-1),
  managed via the Supabase MCP tool (Management API) for schema changes.
- See `docs/PROJECT_SPEC.md` for the full deployment steps breakdown,
  dependencies, and bottleneck analysis.

## Known gaps / not yet built

- No transactional email/SMS/push notifications — all contact actions are
  device-handoff (`tel:`/`wa.me`/`mailto:`), not server-sent.
- No admin UI for HR to edit onboarding tasks or AI Assistant content
  directly (`is_hr_admin` flag exists but nothing uses it yet).
- No automated test suite — verification has been manual (build + lint +
  browser preview) throughout this project.
- No git/CI pipeline currently connected to this deployment.
- Profile picture upload was scoped for feasibility (storage cost estimate
  given) but not implemented.
