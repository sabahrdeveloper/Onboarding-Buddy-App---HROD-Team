/** Entity extraction — regex/list-based (no ML model). Extracts the concrete,
 * reliably-patterned fields; free-text fields like "Name" that need real NER
 * are deliberately not attempted here — a wrong guess is worse than no
 * extraction, and there's no directory to validate a guessed name against. */

export interface ExtractedEntities {
  employeeId?: string;
  email?: string;
  phone?: string;
  date?: string;
  leaveType?: string;
  department?: string;
  designation?: string;
  location?: string;
}

const LEAVE_TYPES: Record<string, string> = {
  casual: "Casual",
  earned: "Earned",
  medical: "Medical",
  bereavement: "Bereavement",
  compensatory: "Compensatory",
  "ছুটি": "Casual",
  emergency: "Medical",
};

// A bounded, known vocabulary — not general NER — matching the departments/
// SBUs that actually recur across this project's onboarding task and
// PeopleDesk content.
const KNOWN_DEPARTMENTS = [
  "hr", "it", "finance", "accounts", "marketing", "sales", "trading",
  "procurement", "admin", "canteen", "payroll", "legal",
];

const KNOWN_DESIGNATIONS = [
  "officer", "executive", "manager", "director", "coordinator", "assistant",
  "associate", "trainee", "intern", "lead",
];

export function extractEntities(rawText: string): ExtractedEntities {
  const text = rawText.trim();
  const entities: ExtractedEntities = {};

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) entities.email = emailMatch[0];

  const phoneMatch = text.match(/(?:\+?880)?0?1[3-9]\d{8}/);
  if (phoneMatch) entities.phone = phoneMatch[0];

  // Employee/enroll numbers in this system are 5-7 digit numerics — checked
  // after phone so an 11-digit phone number is never mistaken for one.
  const idMatch = text.match(/\b\d{5,7}\b/);
  if (idMatch && !entities.phone?.includes(idMatch[0])) entities.employeeId = idMatch[0];

  const dateMatch = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dateMatch) entities.date = dateMatch[0];

  const low = text.toLowerCase();
  for (const [key, label] of Object.entries(LEAVE_TYPES)) {
    if (low.includes(key)) {
      entities.leaveType = label;
      break;
    }
  }
  for (const dept of KNOWN_DEPARTMENTS) {
    if (new RegExp(`\\b${dept}\\b`).test(low)) {
      entities.department = dept.toUpperCase();
      break;
    }
  }
  for (const designation of KNOWN_DESIGNATIONS) {
    if (new RegExp(`\\b${designation}\\b`).test(low)) {
      entities.designation = designation;
      break;
    }
  }

  return entities;
}
