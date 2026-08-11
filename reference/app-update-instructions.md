# App Update Instructions — Onboarding Portal

> Reference doc for implementation. Six changes, numbered in priority order. Each item lists the requirement, expected behavior, and data/schema notes. Open questions are flagged inline — confirm with the product owner (me) before assuming, if genuinely ambiguous.

---

## 1. Login Page — Add "SBU" Field

- Add a new field labeled **"SBU"** (Strategic Business Unit) to the login interface.
- It must be a **dropdown**, not free text.
- Dropdown options must be sourced from a **dedicated Supabase table** (e.g. `sbu_options`), not hardcoded in the app — this lets SBUs be added/edited/removed later without a code change.
- Suggested table shape: `id (pk)`, `name (text)`, `sort_order (int)`, `is_active (bool)`.
- Seed the table with the initial list below (in this order).

### Initial SBU List (seed data)

| # | SBU Name |
|---|---|
| 1 | Akij Resource (Corporate - serving multiple SBUs) |
| 2 | Akij Ispat |
| 3 | Akij Building Solutions Limited |
| 4 | Akij Cement Company Ltd. |
| 5 | Akij Poly Fibre Industries Ltd. |
| 6 | Akij Ready Mix Concrete Ltd |
| 7 | Magnum Steel Industries Limited |
| 8 | Akij Commodities Ltd. |
| 9 | Akij Commodities Ltd. (Trading) |
| 10 | Bongo Traders Ltd |
| 11 | Daily Trading Company Ltd |
| 12 | Nobayon Traders |
| 13 | M/S The Successors |
| 14 | Direct Trading Company Ltd |
| 15 | Asia One Trading Company Ltd |
| 16 | Eurasia Trading Company Ltd |
| 17 | Lineasia Trading Co. Ltd. |
| 18 | Resource Traders Ltd. |
| 19 | Batayon Traders Ltd. |
| 20 | ARL Trading Int. Ltd. |
| 21 | Optima Traders Limited |
| 22 | ARL Traders Ltd. |
| 23 | Exotica Traders Limited |
| 24 | Akij Essentials Ltd. |
| 25 | Hashem Rice Mills Ltd. |
| 26 | Kafil And Razzak Agro Ltd. |
| 27 | Akij InfoTech Ltd. |
| 28 | Akij Telecom Ltd. |
| 29 | Blue Pill Limited |
| 30 | FinTech |
| 31 | Nextjobz |
| 32 | Akij iBOS Limited |
| 33 | Akij Agro Feed Ltd. |
| 34 | Akij Breeders Ltd |
| 35 | Akij Agri Life Limited |
| 36 | Farias Agro Essence |
| 37 | Akij Ocean Line Ltd. |
| 38 | AKIJ Shipping Lines Pte Ltd, Singapore |
| 39 | Akij Maritime Limited |
| 40 | Akij Logistics Ltd. |
| 41 | Akij Shipping Line Ltd. |
| 42 | Akij Light Engineering Limited |
| 43 | Akij Consumer Electronics Ltd. |
| 44 | Akij Electrofab |
| 45 | Akij Engineering Ltd. |
| 46 | Akij Lifecare Limited - Pharmacy |
| 47 | Akij Lifecare Limited - Mediplex |
| 48 | Akij Lifecare Limited - Medical Device |
| 49 | Akij Air Service Ltd. |
| 50 | Akij Consulting Limited |
| 51 | Akij Broadcast Media Ltd |
| 52 | Akij Landmark Limited |
| 53 | Akij Automobile Industries Ltd |
| 54 | Akij Essentials Ltd |

> Note: rows 24 and 54 ("Akij Essentials Ltd.") appear to be duplicates in the original list — worth deduping before seeding, or confirming they're intentionally distinct entities.

- Also add an **"Add Options"** control (admin-facing) so new SBUs can be added to the table from within the app, not just directly in Supabase.

---

## 2. Profile Page — SBU & Contact Fields

- The SBU field on the Profile page is currently empty/manually entered. Change it to be **auto-populated (read-only)** from the SBU the user selected at login — single source of truth, no duplicate manual entry.
- Add new contact fields:
  - **Reporting Manager:** phone number, email
  - **Buddy:** phone number, email

---

## 3. Home Page — Reminder Field

- Add a **"Reminder"** field directly below the existing progress indicator that shows how many days remain for the person to complete their onboarding tasks.
- *Open question:* what should populate this reminder — a static nudge text, the next upcoming task/deadline, or something else? Flag this for confirmation if not already decided.

---

## 4. HR Services Page — Contact Buttons & Fields

- **HR section:** add a button labeled **"HR Contact List"**.
- **IT Support section:** add a button labeled **"IT Contact List"**.
- **Manager section:** add contact detail fields (email, phone).
- **Buddy section:** same as Manager — contact detail fields (email, phone).

> Note: Manager/Buddy contact fields here overlap with the ones added to the Profile page in item 2. Decide whether these pull from the same underlying profile data (recommended, single source of truth) or are separately maintained.

---

## 5. Assistant Button Rename

- Rename the button labeled **"Assistant"** to **"AI Assistant"**.
- Label/copy change only — no functional change implied.

---

## 6. Journey Assessments — Mandatory Tab After Rating

- For every journey milestone, after the rating step, add a **mandatory assessment tab** that the user must complete before proceeding.
- The actual question sets for each milestone are now available (see below) — **build these as native in-app forms rather than linking out to Google Forms.** Since we have the full field/question list, an embedded form gives you a reliable "completed" state to gate progress on, which an external Google Form link cannot easily provide (no submission webhook to check against). This resolves the earlier open question about how to enforce "mandatory."
- All three forms share a common **identity block** at the top (employee ID, name, email, designation, team, section, SBU — the SBU value should auto-fill from the profile/login selection per items 1–2, not be re-entered). The rest of each form is a list of yes/no or short-answer review questions.
- Suggested schema: an `assessments` table (`id`, `user_id`, `milestone` [30/60/90], `submitted_at`) plus an `assessment_responses` table (`assessment_id`, `question_key`, `answer`) — or a single JSONB `responses` column on `assessments` if you prefer to keep it simple.
- Response type for each question below is a judgment call during build — most read naturally as Yes/No, some may warrant Yes/No/Partial or a short free-text follow-up. Flag any you're unsure about rather than guessing silently.

### 30-Day Assessment

**Identity fields:** Employee ID, Full Name, Company Email Address, Designation, Team, Section, SBU

**Questions:**
1. Was your job role, responsibilities, and expectations reviewed?
2. Was your access to systems (email, HR software, project management tools, etc.) ensured?
3. Were you properly introduced to your immediate team members and did you understand their roles?
4. Were you properly introduced to the company's history, mission, and values?
5. Did you receive a comprehensive orientation on company policies (attendance, security, etc.)?
6. Were the company culture, work ethics, and communication styles explained to you?
7. Did you receive mandatory compliance training (privacy, safety, etc.)?
8. Did your HR buddy help you set up your employee email, document storage access, and communication channels?
9. Were you familiarized with company policies (leave policy, dress code, ethics, etc.)?
10. Were you given access to the employee handbook and related documents?
11. Were you assigned a mentor or buddy for guidance during your first 90 days?
12. Were your initial KPIs and performance expectations reviewed with you?
13. Did you set up a meeting with your direct manager to discuss first-month goals?
14. Were you familiarized with the company's internal communication platforms (Google Workspace, PeopleDesk)?
15. Were you introduced to the company structure, departments, and key leadership?
16. Were you given an overview of the company's products, services, and target markets?
17. Are you able to set up tools for tracking work progress and setting reminders?
18. Was the role of your department within the company explained to you?
19. Have you received your first project/task for review and learning purposes so far?
20. Did you schedule a 1:1 feedback session with your manager after your first week?
21. Was your performance against KPIs checked and discussed for improvement?
22. Was a feedback session arranged to discuss your strengths, weaknesses, and development areas?

> Note: a couple of items in the source doc had a stray duplicated line/quote mark — consolidated here to one clean question. Worth a quick sanity check against your working copy to confirm nothing was dropped.

### 60-Day Assessment

**Identity fields:** Employee ID (e.g. EMP001), Full Name, Company Email, Designation, Team, Section, SBU

**Questions:**
1. Was your integration with the team and your role in collaboration evaluated properly?
2. Was your ability to complete work independently and meet deadlines evaluated properly?
3. Was your proficiency in the tools and systems necessary for your role ensured?
4. Were you provided training on advanced tools or systems for task automation and collaboration?
5. Did you arrange a meeting with HR to evaluate your satisfaction with the work environment?
6. Were you provided constructive feedback on your initial projects/tasks?
7. Were you encouraged to participate in company-wide events (workshops, team activities)?
8. Were you involved in at least one cross-department project?
9. Were you provided continued mentoring with regular check-ins?
10. Were you provided with learning resources or certifications relevant to your growth path?
11. Were you able to communicate effectively within the team?
12. Were you actively contributing ideas and feedback to the team?
13. Did you set up a meeting with senior management for long-term career discussions?
14. Are you familiar with all relevant projects and initiatives?
15. Did you discuss personal development goals and identify any skill gaps for career advancement?
16. Was progress on your KPIs reviewed, with adjustments made if needed?
17. Was your initiative in solving problems independently evaluated?

> Note: the source doc phrased several questions in the third person ("evaluate the recruit's...") mixed with second person ("were you..."). Standardized to second person throughout since the recruit is filling this out themselves — confirm that's the intended respondent.

### 90-Day Assessment

**Identity fields:** Email Address, Employee ID, Employee Name, Company Email, Designation, Team, Section, SBU

**Questions:**
1. Did your manager discuss future growth opportunities, potential promotions, and career development plans with you?
2. Did your manager conduct a formal performance review with you, including both a self-assessment and manager feedback, by Day 90?
3. Were you given the opportunity to discuss and assess how well you had integrated into the company culture and work environment?
4. Did your manager review your overall job performance and compare it against your assigned KPIs?
5. Did your manager identify areas for your continued development and provide clear, actionable feedback?
6. Did your manager discuss whether you were meeting the organization's long-term performance expectations?
7. Were you provided with opportunities to take on leadership responsibilities or additional tasks?
8. Did your manager evaluate and discuss your collaboration within your team and across other departments?
9. Did your manager assess and provide feedback on your contribution toward the team's objectives and goals?
10. Were you given opportunities to demonstrate your ability to handle pressure and manage multiple priorities, and was this discussed with your manager?
11. Did you and your manager prepare or discuss an action plan for your continued professional development?

---

## Summary Checklist

- [ ] 1. Login: SBU dropdown, backed by Supabase `sbu_options` table, with admin "Add Options" UI
- [ ] 2. Profile: SBU auto-filled from login; add Reporting Manager + Buddy contact fields
- [ ] 3. Home: Reminder field under progress indicator
- [ ] 4. HR Services: HR Contact List button, IT Contact List button, Manager + Buddy contact fields
- [ ] 5. Rename "Assistant" → "AI Assistant"
- [ ] 6. Mandatory assessment tab after rating, built as native 30/60/90-day forms in-app (question sets included above), gating progress on submission
