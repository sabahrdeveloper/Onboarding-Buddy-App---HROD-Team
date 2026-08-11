export interface RolePerson {
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface SbuHrAssignment {
  cluster: string;
  sbuDisplayName: string;
  sbuAliases: string[];
  collisionLabel: string | null;
  hrClusterHead: RolePerson;
  hrbp: RolePerson;
  hrSs: RolePerson;
  itHead: RolePerson;
}

/** Case/punctuation/whitespace-insensitive comparison — not fuzzy beyond that,
 * so deliberately-distinct SBUs (e.g. Pharmacy vs Mediplex) never accidentally
 * collide. Matches are driven by explicit alias lists, not automatic fuzzing. */
export function normalizeSbuName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.,()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function findSbuAssignments(employeeSbu: string | null | undefined, rows: SbuHrAssignment[]): SbuHrAssignment[] {
  if (!employeeSbu) return [];
  const target = normalizeSbuName(employeeSbu);
  return rows.filter((r) => r.sbuAliases.some((a) => normalizeSbuName(a) === target));
}

/**
 * Combines one role across however many rows matched. Usually exactly one row
 * matches. When an SBU name is genuinely shared by more than one real entity
 * (e.g. two different "Akij Essentials" companies), multiple rows match and
 * both people are shown together, each labeled with which entity they belong to.
 */
export function combineRole(matches: SbuHrAssignment[], pick: (row: SbuHrAssignment) => RolePerson): RolePerson | null {
  const entries = matches.map((m) => ({ label: m.collisionLabel, person: pick(m) })).filter((e) => e.person.name);
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0].person;

  const name = entries.map((e) => (e.label ? `${e.person.name} (${e.label})` : e.person.name)).join(" / ");
  const phones = entries.map((e) => e.person.phone).filter((p): p is string => Boolean(p));
  const emails = entries.map((e) => e.person.email).filter((e): e is string => Boolean(e));
  return {
    name,
    phone: phones.length ? phones.join(" / ") : null,
    email: emails.length ? emails.join(" / ") : null,
  };
}
