# OnboardingBuddy — Project Specification

## 1. Objective

Give every new Akij Resource employee a structured, self-service 180-day
onboarding journey — a 50-task checklist across 30/60/90-day phases, guided
assessments, and a growth review — that reduces the manual coordination
burden on HR and line managers, ensures every new hire is routed to the
correct HR/IT/Manager/Buddy contact regardless of which of the company's
many SBUs they belong to, and provides a first-line, always-available answer
source for both onboarding-process questions and (per the latest expansion)
day-to-day PeopleDesk ERP usage questions — with a clear, honest path to
grow that answer source's capability over time.

## 2. Requirements

### 2.1 Business-level requirements

- Standardize the onboarding experience company-wide, across all SBUs/
  clusters, instead of ad hoc per-department onboarding.
- Reduce time HR and managers spend answering repetitive "how do I..."
  onboarding and PeopleDesk questions.
- Give management visibility into new-hire progress (task completion,
  assessment results) without manual check-ins, via the Manager Portal.
- Guarantee correct HR/IT/Manager/Buddy contact routing per employee,
  reconciled against real organizational structure (48 SBUs currently
  mapped), not a single generic HR number for the whole company.
- Support a Bangla-first, English-technical-term-mixed experience matching
  how the company actually communicates internally.
- Tie engagement data (assessments, buddy assignment, growth review) to real
  HRIS (PeopleDesk) identity, not spreadsheets or manual tracking.

### 2.2 Service-level requirements (non-functional)

- **Availability**: mobile web only (no native app); must work well in a
  phone-frame responsive layout on real devices, not just desktop.
- **Authentication**: enroll number + password login; first login
  auto-provisions from PeopleDesk; subsequent logins never depend on
  PeopleDesk being reachable.
- **Data isolation**: enforced at the database level via Postgres
  Row-Level Security on every table — an employee sees only their own data
  unless they are the confirmed reporting manager of another employee
  (verified by matching PeopleDesk-sourced emails, not a manually-assigned
  role).
- **Performance**: sub-second perceived navigation between bottom-nav tabs
  (met via Next.js client router cache tuning, `loading.tsx` skeletons, and
  optimistic UI for task completion).
- **Localization**: Bangla-first copy with English terms mixed in, matching
  existing internal communication style; numerals in Home/Profile shown in
  English/Arabic numeral form per explicit requirement.
- **Data minimalism**: sensitive PeopleDesk data (salary, exact leave
  balances, attendance logs) is never duplicated into OnboardingBuddy's own
  database; PeopleDesk is called only at point of need (login).

### 2.3 Function-level requirements

| Module | Requirement |
|---|---|
| Splash / Login / Forgot Password | Enroll number + password auth; PeopleDesk validation on first login; password reset flow |
| Home | Overall progress %, current phase, days-remaining reminder, completed/pending counts, HR Services grid |
| Journey | Full 50-task list, grouped by phase; phase-view; task manual (why/how/who/deadline/mark-done) |
| Task completion | Mark-as-done with optimistic UI; phase-complete celebration |
| Assessments | 30/60/90-day rating assessment + mandatory milestone identity/response tab; 180-day Growth Review, gated on all tasks + all three prior assessments being complete |
| Contacts | Dynamic per-SBU HR/IT resolution (`sbu_hr_assignments`); functional Call/WhatsApp/Message buttons (`tel:`/`wa.me`/`mailto:`); company-wide HR/IT contact list popup with SBU shown per person |
| AI Assistant | Answers onboarding-task questions and PeopleDesk ERP questions in English/Bangla/Banglish via local matching (no external LLM); "under development" banner shown |
| Manager Portal | Conditional Team tab for reporting managers; subordinate list with progress; per-assessment manager feedback (separate from employee's own comment); Buddy assignment |
| Help / Grievance | Ticketed help request submission, tied to a specific task if applicable |
| Profile | Employee details from PeopleDesk, badges, sign out; Buddy-not-assigned messaging when unset |

## 3. Dependencies

| Category | Dependency | Role |
|---|---|---|
| Hosting | Vercel | Next.js build/hosting, serverless functions, production domain |
| Database/Auth | Supabase (Postgres + Auth + RLS) | System of record for all app data, session management |
| Framework | Next.js 16 / React 19 / TypeScript | Application framework |
| Styling | Tailwind CSS v4 | Design system implementation |
| Fonts | Google Fonts (Manrope, Hind Siliguri) | Typography, loaded via `next/font` |
| External company system | PeopleDesk HR API | Sole source of truth for employee SBU/department/manager/email at login |
| Tooling | Supabase Management API / MCP | Schema migrations, type generation, security advisors |
| Deployment tooling | Vercel CLI | Manual production deploys |

**Explicitly not a dependency** (by deliberate design decision, not oversight):
no LLM/AI API, no email/SMS delivery provider, no push notification service.

## 4. Probable bottlenecks and alternative workarounds

### 4.1 PeopleDesk API — single-record lookup only, no directory/bulk endpoint
**Bottleneck**: Every login/signup blocks on a live per-enroll-number API
call; there is no way to pre-populate a company directory; if PeopleDesk is
unreachable, first-time logins fail outright with no fallback.
**Alternatives**:
- Request a bulk/directory export or webhook-based sync from the PeopleDesk
  team so OnboardingBuddy can maintain a periodically-refreshed local cache
  instead of a live call on every first login.
- Add a short-lived cache of PeopleDesk responses (keyed by enroll number)
  in Supabase to reduce dependency on live-call latency for near-duplicate
  requests during a hiring wave.
- Build a manual HR-admin override path to hand-enter employee master data
  if PeopleDesk is down during an onboarding cohort's start date.

### 4.2 No live organization/SBU-to-HR-contact API
**Bottleneck**: `sbu_hr_assignments` (48 rows) was built by manually
reconciling a static Excel export; any SBU rename, restructuring, or HR/IT
personnel change requires a manual database edit — there is no live sync.
**Alternatives**:
- Negotiate a periodic (weekly/monthly) CSV or API export from People &
  Culture as the source of truth, ingested via a small script instead of
  manual reconciliation.
- Longer-term, request read access to whatever backs PeopleDesk's own
  Organogram feature, so contact routing can derive from the same
  authoritative org chart PeopleDesk itself uses.

### 4.3 Supabase MCP/tooling connectivity is not always available
**Bottleneck**: Observed directly during this project — extended periods
where the Supabase MCP tool was disconnected, forcing a manual Personal
Access Token + direct API workaround for schema changes (slower, more
credential-handling risk).
**Alternatives**:
- Track schema history in a versioned `supabase/migrations/*.sql` folder
  checked into the repo (currently not done — all migrations were applied
  ad hoc), so schema state is reproducible independent of which tool applied
  it.
- Adopt the Supabase CLI (`supabase migration new` / `supabase db push`) as
  a tool-independent fallback path that doesn't depend on MCP availability.

### 4.4 No native mobile app — web-only, no push notifications
**Bottleneck**: Cannot proactively remind employees about pending tasks or
assessments; entirely relies on the employee opening the web app.
**Alternatives**:
- Add a PWA manifest + service worker for installability and web push where
  the platform supports it.
- Integrate with an existing company channel (email digest or WhatsApp
  Business API) to nudge employees — see the integrations section below.

### 4.5 AI Assistant has no LLM backing (deliberate tradeoff)
**Bottleneck**: Cannot handle genuinely novel phrasing or implied/indirect
questions (e.g. "I don't want to go to office" does not get inferred as "how
do I apply for leave") — this was confirmed directly during testing and is
an accepted limitation of keyword-based matching, not a bug to be fully
eliminated.
**Alternative**: the grounding data (Task Q&A + PeopleDesk KB, ~350 entries)
is already structured and exportable; adding an `ANTHROPIC_API_KEY` and a
thin server-side call would upgrade matching quality without changing the
underlying data model. This was scoped and explicitly deferred, not
technically blocked.

### 4.6 Single Supabase project, single region, no read replica
**Bottleneck**: A Supabase outage or regional incident takes down auth and
all application data simultaneously; there is no offline mode.
**Alternatives**:
- Confirm the Supabase plan tier includes point-in-time recovery and daily
  backups appropriate for production HR data.
- Document a manual "go to PeopleDesk / contact HR directly" fallback
  procedure for employees/managers during an outage window.

### 4.7 Manual deployment, no CI/CD pipeline
**Bottleneck**: Deploys are triggered manually via `vercel deploy --prod`
from a local machine; there is no automatic preview-per-change, no test gate
before production, and git history for this project was intentionally not
maintained during this build phase.
**Alternatives**:
- Initialize git and connect the Vercel project to a GitHub repository for
  automatic PR preview deployments and protected production merges.
- Add a minimal CI gate (`npm run build && npm run lint`, and unit tests
  for `lib/business-rules.ts` once written) before allowing a merge to the
  deploy branch.

### 4.8 No content-admin UI
**Bottleneck**: HR/People & Culture cannot self-serve edit onboarding task
text or AI Assistant answers — every content change requires direct
database access.
**Alternative**: build a lightweight admin screen gated by the existing
(currently unused) `is_hr_admin` flag on `profiles`, scoped to editing
`onboarding_tasks`, `assistant_kb`, and `peopledesk_kb` rows.

## 5. Necessary integrations across standard omni-channels

| Channel | Current state | What a full integration would add |
|---|---|---|
| Email | Device-handoff only (`mailto:` opens the user's own mail client) | Transactional sending (welcome email, task reminders, help-ticket confirmations) via a provider (Resend/SendGrid) or the company's existing SMTP relay |
| Phone/Voice | Device-handoff only (`tel:`) | No further integration expected to be needed for this app's scope |
| WhatsApp | Device-handoff only (`wa.me`, opens chat with a contact, no message content) | WhatsApp Business Platform API (Meta) for proactive reminders or answering AI Assistant questions directly inside WhatsApp |
| SMS | Not integrated | A provider (Twilio or a Bangladesh-local gateway) for OTP/password-reset backup or reminders in low-connectivity conditions |
| PeopleDesk (company ERP) | Read-only, single-employee lookup at login only | Deep-linking into PeopleDesk's own Leave/Attendance/Movement/Expense/Grievance screens, or a proper API integration with those modules if PeopleDesk exposes one — this is the most consequential channel to deepen, since OnboardingBuddy's AI Assistant now answers PeopleDesk questions but cannot yet act on them |
| Microsoft Teams / Slack | Not integrated | A bot/webhook for HR notifications (new hire registered, help ticket raised, assessment overdue) |
| Push notifications | Not integrated | PWA + web push, see bottleneck 4.4 |

## 6. Deployment steps breakdown

### 6.1 One-time setup (already complete for this project)

1. Provision a Supabase project (currently `wxazzkcwevsqqifglysc`,
   `ap-southeast-1`).
2. Apply schema migrations: 17 tables, RLS policies on every table, and the
   SECURITY DEFINER helper functions (`current_enroll_number`,
   `is_hr_admin`, `is_manager`, `is_manager_of`, `manager_set_buddy`,
   `manager_set_feedback`).
3. Seed reference/config data: 50 onboarding tasks, assessment templates,
   badges, generic contacts, `assistant_kb`, `sbu_hr_assignments` (48 rows),
   `peopledesk_kb` (96 rows), milestone assessment templates.
4. Create and link a Vercel project (`.vercel/project.json`); configure
   production environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `PEOPLEDESK_API_URL`, `PEOPLEDESK_API_KEY`, `PEOPLEDESK_API_TOKEN`.
5. (Optional, not yet done) map a company subdomain to the Vercel
   deployment instead of the default `*.vercel.app` domain.

### 6.2 Per-deploy steps (repeated for every change)

1. Make code changes locally.
2. `npm run build` — verify the production build compiles and TypeScript
   passes.
3. `npm run lint` — verify ESLint passes clean.
4. If the change includes a schema migration: apply it via the Supabase
   Management API/MCP (`apply_migration`), then regenerate
   `lib/supabase/types.ts` (`generate_typescript_types`) to keep the app's
   types in sync with the live schema.
5. `npx vercel deploy --prod --yes` — builds on Vercel's infrastructure and
   promotes the result to production, aliased to
   `onboardingbuddy.vercel.app`.
6. Manual smoke-check — no automated test suite exists yet, so verification
   is currently build/lint plus manual browser-preview checks of the
   affected flow.

### 6.3 Recommended deployment hardening (ties to bottleneck 4.7)

- Git + CI: connect the repository to Vercel via GitHub for automatic PR
  preview deployments and a protected production branch.
- Track migrations in git (`supabase/migrations/*.sql`) rather than relying
  solely on what is currently live in Supabase.
- Add automated tests, starting with `lib/business-rules.ts` (pure
  functions — cheap to cover) and expanding to server actions.
- Add a staging environment: a second Supabase project + a Vercel preview
  environment, so schema and content changes can be validated before they
  reach the production Supabase project that live employee data lives in.
