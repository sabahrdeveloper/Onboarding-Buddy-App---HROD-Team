---
name: app-skill
description: Interview a non-technical user, then build a full-stack Next.js + Supabase + Vercel business app from scratch, replicating the process used to build OnboardingBuddy. Use when user says "build me an app", "make an app like OnboardingBuddy", or invokes /app-skill.
---

# App Builder Skill

Target user: zero coding knowledge. Do NOT explain process, architecture, or ask them to make technical decisions. Ask plain-language questions, translate answers into the stack below yourself, then build.

## Step 1 — Interview (ask one block at a time, wait for answers)

Ask in order. Skip a question if answer obvious from prior context.

**Block A — What is this app for**
1. What's the app called?
2. Who uses it? (e.g. "employees at my company", "customers", "students")
3. In 2-3 sentences, what does it do? What problem does it solve?
4. Are there different types of users with different views (e.g. regular user vs manager/admin)? List roles.

**Block B — Data**
5. Does this need to pull data from an existing system you already use (HR software, CRM, spreadsheet export, another database)? If yes: name it, and do you have API access / credentials / docs for it?
6. If no existing system: what are the main "things" the app tracks? (e.g. tasks, orders, tickets, students) — one list of nouns is enough, do not ask them to design a schema.

**Block C — Core features**
7. List the main actions a user takes in the app (e.g. "check off a task", "submit a request", "approve a request", "chat with a bot"). Bullet list, plain language.
8. Any of those actions need a second person's approval before they count as final? (e.g. manager approves employee's submission)
9. Does the app need a chatbot/assistant that answers questions? If yes, in what language(s)?
10. Does it need file/ticket-style support requests routed to a team?

**Block D — Look and feel**
11. Any existing brand color / logo / reference app whose look you like? If none, default to clean green-accented mobile-first UI (this app's own style).
12. Mobile app feel (phone-sized single column) or normal website layout?

**Block E — Accounts & deploy**
13. Do you already have empty Supabase project + Vercel account, or should I explain what to create (in plain terms, not technical steps) before I can deploy?
14. Any real people's data going in at launch, or test data only for now?

Do not proceed past Step 2 until Block A–C answered. D/E can default silently if skipped (green mobile-first UI, ask for Supabase/Vercel access only when ready to deploy).

## Step 2 — Translate answers into build plan (internal, don't narrate)

Map interview answers to:
- **Entities** = Block B nouns → Postgres tables.
- **Roles** = Block A.4 → RLS policies + role flag columns on `profiles`.
- **External system** = Block B.5 → integration client under `lib/<system>.ts`, used only at first-login provisioning (see Auth Pattern below). If none, plain signup instead.
- **Actions** = Block C.7 → server actions in `actions/<feature>.ts`.
- **Approval flow** = Block C.8 → status column (`pending/approved/rejected`) + role-gated review action, same pattern as this app's KPI approval.
- **Assistant** = Block C.9 → optional chat feature, keyword/IDF matching (no paid LLM API needed) unless user explicitly wants one.
- **Tickets** = Block C.10 → support-ticket table + routing rule.

Confirm the plan back to user in ONE short plain-language paragraph ("So I'll build X for Y users who can Z. Sound right?"). Get a yes before writing code.

## Step 3 — Scaffold (do this yourself, don't ask permission for each step)

Stack (fixed, proven from OnboardingBuddy):
- Next.js (latest App Router) + TypeScript + Tailwind CSS v4 (CSS `@theme inline` tokens in `app/globals.css`, no tailwind.config.ts)
- Supabase: Postgres + RLS + Auth (email/password via synthetic email if login is by ID not email — see Auth Pattern)
- Server Actions for all writes (`"use server"`), no separate REST/API layer
- Deploy: Vercel CLI (`npx vercel deploy --prod --yes`)

```
app/(app)/<feature>/page.tsx       — server component pages, one per screen
components/<feature>/*.tsx          — client components for interactive bits
actions/<feature>.ts                — "use server" mutations
lib/data/queries.ts                 — cached (React.cache) shared reads
lib/supabase/{server,client,admin}.ts
lib/<external-system>.ts            — external API client, if any
```

Build in this order every time:
1. `mcp__supabase__apply_migration` — create tables + RLS policies for entities/roles identified in Step 2. Every table gets RLS on. Self-access policy (`owner_id = auth.uid()` or `enroll_number = current_user()`-style helper function) plus role-based policy for the second role if one exists.
2. Auth pages + action (see Auth Pattern).
3. One page per core action from Block C.7, simplest first (list/view before create before approve).
4. Approval flow if Block C.8 said yes: status column + role-gated server action, mirroring `assertIsManagerOf`-style explicit check in the action itself — never trust RLS alone to separate "edit own" from "approve as reviewer" when one policy covers both.
5. Assistant if requested: keyword/IDF match against a seeded Q&A table, no external LLM call, Bangla/English/mixed input normalization if multilingual.
6. Ticket system if requested: table + list view + status.
7. `npm run build && npm run lint` clean before every deploy.
8. `mcp__supabase__get_advisors` (security) — fix every new warning before deploy.
9. Live-verify each new feature by loading it in the browser preview before telling user it's done. Never claim "done" from code-reading alone.
10. `npx vercel deploy --prod --yes`, report the URL back in plain language ("Your app is live at X").

## Auth Pattern (login by ID, not email)

If Block A.2 implies users log in by an internal ID (employee number, student ID, etc.) rather than email:
- Derive a synthetic email: `<prefix>.<id>@<real-company-domain>` (Supabase rejects fake TLDs like `.local`/`.test`).
- Login flow: try `signInWithPassword` first (fast path). On failure, look up the ID in the external system (Block B.5) — if found, `signUp` with whatever password they typed (first login sets the password), then provision `profiles` + entity rows from the external record. If not found in external system, reject — never let an unregistered ID create an account.
- Never ask the entity's own name/role/department as form input if it's available from Block B.5's external system — pull it, don't ask twice.

## Non-negotiable rules (carried over from OnboardingBuddy build)

- RLS on every table, always. Service-role/admin client still needs explicit Postgres `GRANT` per table even though it bypasses RLS — grant only what's used.
- Role-based actions (approve, reject, admin-only edit) get an explicit code-level check in the server action, not just RLS, whenever the same RLS policy also permits "edit my own" — self-approval bugs hide exactly here.
- Don't build a feature "maybe useful later." Build exactly what Step 1 answers describe. Ask, don't assume.
- Every deploy: build clean, lint clean, advisors clean, one live click-through in browser before saying "done."
- If a requested action would touch real external people (send an email/SMS/ticket to real staff) or mutate data belonging to someone who isn't a disposable test account, stop and ask user by name before doing it — do not silently skip or silently do it.

## Step 4 — Handoff

End by giving user, in plain language:
- The live URL.
- Login instructions in their terms ("go to X, enter your employee ID and any password").
- One sentence on how to ask for more features later ("just tell me what you want added").

Never show them code, table names, or file paths unless they ask.
