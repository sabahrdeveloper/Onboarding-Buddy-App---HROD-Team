import type { SbuHrAssignment } from "@/lib/sbu-matching";

export interface ContactListEntry {
  name: string;
  email: string | null;
  phone: string | null;
  sbu: string;
}

interface AccEntry {
  name: string;
  phone: string | null;
  email: string | null;
  sbus: string[];
}

function addEntry(
  acc: Map<string, AccEntry>,
  person: { name: string | null; phone: string | null; email: string | null },
  sbuDisplayName: string,
) {
  if (!person.name) return;
  const dedupeKey = (person.email || person.name).trim().toLowerCase();
  const existing = acc.get(dedupeKey);
  if (existing) {
    if (!existing.sbus.includes(sbuDisplayName)) existing.sbus.push(sbuDisplayName);
    return;
  }
  acc.set(dedupeKey, { name: person.name, phone: person.phone, email: person.email, sbus: [sbuDisplayName] });
}

function toEntries(acc: Map<string, AccEntry>): ContactListEntry[] {
  return [...acc.values()]
    .map((e) => ({ name: e.name, phone: e.phone, email: e.email, sbu: e.sbus.join(", ") }))
    .sort((x, y) => x.name.localeCompare(y.name));
}

/** Builds the company-wide HR/IT contact lists shown in the "HR Contact List" /
 * "IT Contact List" popups — every distinct cluster HR person / IT Head across
 * all SBUs, not just the employee's own, per the confirmed "give all company
 * wide available contacts" requirement. Each person is tagged with every SBU
 * they cover (a Cluster Head/IT Head often covers several). */
export function buildCompanyWideContactLists(assignments: SbuHrAssignment[]): {
  hr: ContactListEntry[];
  it: ContactListEntry[];
} {
  const hrAcc = new Map<string, AccEntry>();
  const itAcc = new Map<string, AccEntry>();

  for (const a of assignments) {
    addEntry(hrAcc, a.hrClusterHead, a.sbuDisplayName);
    addEntry(hrAcc, a.hrbp, a.sbuDisplayName);
    addEntry(hrAcc, a.hrSs, a.sbuDisplayName);
    addEntry(itAcc, a.itHead, a.sbuDisplayName);
  }

  return { hr: toEntries(hrAcc), it: toEntries(itAcc) };
}
