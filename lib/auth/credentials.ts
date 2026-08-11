// Supabase Auth (GoTrue) rejects made-up/example domains outright ("Example and
// test domains are currently not supported"), even for password-only accounts
// nobody ever emails. Use the real company domain with a clearly-synthetic
// local-part prefix instead — it has valid MX records and passes validation,
// and the address itself is never shown to the employee (only enroll number is).
const EMAIL_DOMAIN = "akijresource.com";
const EMAIL_LOCAL_PREFIX = "onboardingbuddy.";

export const MIN_PASSWORD_LENGTH = 8;

/** Derives the deterministic synthetic Supabase auth email for an enroll number. */
export function deriveSyntheticEmail(enrollNumber: string): { email: string; enrollNumber: string } {
  const normalizedEnroll = enrollNumber.trim().toLowerCase().replace(/\s+/g, "");
  const email = `${EMAIL_LOCAL_PREFIX}${normalizedEnroll}@${EMAIL_DOMAIN}`;
  return { email, enrollNumber: normalizedEnroll };
}
