/** Synthetic QA accounts (test9001, test9002, ...) — never shown in any
 * employee-facing listing (HR roster, leaderboard, completions feed).
 * Direct URL access to their own pages still works; this only hides them
 * from lists. */
export function isTestEmployee(enrollNumber: string): boolean {
  return enrollNumber.toLowerCase().startsWith("test");
}
