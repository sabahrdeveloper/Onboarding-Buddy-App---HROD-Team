# App Update Instructions — Round 2 (Journey / Assessment Refinements)

> Follow-up to `app-update-instructions.md`. Read both files, in order (1 then 2). Where an item here changes something already described in doc 1, **this doc wins** — it reflects the corrected/current requirement.

---

## 1. HR Services Page — Contact List Buttons (Refinement)

- Clarifies doc 1, item 4: **HR Contact List** and **IT Contact List** should each be a button placed *inside* their respective section (HR section / IT Support section), styled consistently with the existing **Call** / **WhatsApp** buttons already in that section — not a new standalone element with different styling.
- For now, this button does **not** need to be wired to a live data source. Build it as UI-only (placeholder tap target, or a static/dummy list) — it will be connected to the company database later.

---

## 2. Assessment / Rating Tab Order — Change

- **Current:** Rating tab → Assessment tab
- **Required:** swap the order so **Assessment tab → Rating tab**

> ⚠️ This changes the flow implied in doc 1, item 6 ("after rating, add mandatory assessment tab"). The assessment now comes *before* rating, not after. Implement per this doc — the tab order and any "complete X before Y" gating logic should follow Assessment → Rating.

---

## 3. Rating Tab Label

- Change the label **"Rating (SELF / MANAGER / HR)"** to **"YOUR EXPERIENCE"**.

---

## 4. Rating Questions — Replace

Replace the existing rating questions with the 9 items below. Each is answered on a **1–4 scale**:
`1 = Strongly Disagree · 2 = Somewhat Disagree · 3 = Agree · 4 = Strongly Agree`

| # | Question |
|---|---|
| 1 | I clearly understand my role and responsibilities. |
| 2 | I understand my team's goals and how my work contributes. |
| 3 | I received the necessary system access, tools, and resources to perform my job. |
| 4 | I feel welcomed and comfortable working with my team. |
| 5 | My manager provides clear guidance and support when needed. |
| 6 | I understand the company's policies, culture, and ways of working. |
| 7 | I have received sufficient training to perform my responsibilities. |
| 8 | I feel comfortable asking questions and seeking help. |
| 9 | Overall, I am satisfied with my onboarding experience. |

- Store responses using a pattern consistent with the assessment tables from doc 1 (e.g. a `ratings` table, or extend `assessment_responses`) — one integer value (1–4) per question, tied to the user and the relevant journey/milestone.
- *Open question:* does this fixed set of 9 questions apply once per overall journey, or once per milestone (30/60/90), matching the assessment tab's cadence? Confirm before assuming — it affects the schema and whether the tab repeats at each milestone.

---

## 5. AI Assistant Tab — Back Button

- Add a back button to the **AI Assistant** tab (renamed from "Assistant" per doc 1, item 5) — it currently has no way to navigate back.

---

## Summary Checklist

- [ ] 1. HR/IT Contact List as in-section buttons matching existing Call/WhatsApp style (UI only, no data wiring yet)
- [ ] 2. Swap tab order: Assessment first, then Rating (supersedes doc 1's implied order)
- [ ] 3. Rename rating label to "YOUR EXPERIENCE"
- [ ] 4. Replace rating questions with the 9-item, 1–4 scale list above
- [ ] 5. Add back button to AI Assistant tab
