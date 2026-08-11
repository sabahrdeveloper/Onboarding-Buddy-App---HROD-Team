/** Colloquial phrase → intent shortcuts. Employees describe *situations*
 * ("ajke office jete parbo na"), not feature names — and situation words are
 * exactly the ones the keyword matcher can't use (they're stopwords or daily
 * vocabulary shared by everything). This deterministic layer recognizes those
 * expressions ahead of IDF scoring and routes them to the right intent, with
 * optional slot prefills (e.g. "shorir kharap" → leave flow with
 * leave_type already set to Medical). */

export interface PhraseMatch {
  intentId: string;
  /** Slots the phrase itself already answers, so the guided flow can skip
   * asking for them. */
  slotPrefills: Record<string, string>;
}

interface PhraseRule {
  intentId: string;
  slotPrefills?: Record<string, string>;
  /** Every group must have at least one term present in the message. */
  allOf: string[][];
}

// Terms are matched as substrings of the normalized message (lowercase,
// punctuation stripped), so Banglish inflections like "jete/jetei" still hit.
const PHRASE_RULES: PhraseRule[] = [
  // "Can't / don't want to come to office (today)" → leave guidance
  {
    intentId: "APPLY_LEAVE_GUIDED",
    allOf: [
      ["office", "offis", "অফিস"],
      ["jete", "jabo", "jaoa", "jawa", "asbo", "ashbo", "aste", "ashte", "যেতে", "যাবো", "যাব", "আসতে", "আসবো"],
      ["na", "nai", "পারব না", "পারবো না", "চাই না", "নাই"],
    ],
  },
  // Sick / unwell → leave guidance, medical variant pre-selected
  {
    intentId: "APPLY_LEAVE_GUIDED",
    slotPrefills: { leave_type: "Medical" },
    allOf: [["osustho", "oshustho", "asustho", "shorir kharap", "sorir kharap", "jor", "fever", "sick", "অসুস্থ", "শরীর খারাপ", "জ্বর"]],
  },
  // Going out of office for work → Movement
  {
    intentId: "PD_e1f57139",
    allOf: [
      ["bahire", "baire", "bayre", "field", "client visit", "market visit", "বাইরে", "ফিল্ড"],
      ["jabo", "jete", "jacchi", "jachchi", "visit", "kaj", "যাবো", "যাব", "যেতে", "যাচ্ছি", "কাজ"],
    ],
  },
  // Salary not received / wrong → raise a ticket, issue type prefilled
  {
    intentId: "REQUEST_HELP",
    slotPrefills: { issue_type: "Other (Salary/Payslip)" },
    allOf: [
      ["beton", "salary", "বেতন", "payslip"],
      ["pai nai", "paini", "pai ni", "dhoke nai", "dhokenai", "dhukse na", "dhukse nai", "ashe nai", "asheni", "ase nai", "kom", "vul", "bhul", "wrong", "পাইনি", "পাই নি", "ঢোকেনি", "আসেনি", "কম", "ভুল"],
    ],
  },
];

export function matchPhrase(normalizedText: string): PhraseMatch | null {
  const padded = ` ${normalizedText} `;
  for (const rule of PHRASE_RULES) {
    const allGroupsHit = rule.allOf.every((group) =>
      group.some((term) => padded.includes(term.length <= 3 ? ` ${term} ` : term)),
    );
    if (allGroupsHit) {
      return { intentId: rule.intentId, slotPrefills: rule.slotPrefills ?? {} };
    }
  }
  return null;
}
