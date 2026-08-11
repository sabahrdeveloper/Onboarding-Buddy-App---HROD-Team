export interface ContactActionInfo {
  name: string;
  phone: string | null;
  email?: string | null;
}

/** Converts a local Bangladeshi number ("01XXXXXXXXX") to the international
 * digits-only format wa.me requires ("880XXXXXXXXX"). Leaves already-international
 * numbers (880... or +880...) as-is. */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}
