const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Converts a number's Arabic digits to Bangla numerals, matching the prototype's bn() helper. */
export function bn(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
