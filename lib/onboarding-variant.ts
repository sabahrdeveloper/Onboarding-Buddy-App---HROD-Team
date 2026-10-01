import { normalizeSbuName } from "@/lib/sbu-matching";
import type { Database } from "@/lib/supabase/types";

type OnboardingVariantRow = Database["public"]["Tables"]["onboarding_variants"]["Row"];

export interface OnboardingVariant {
  id: string;
  slug: string;
  name: string;
  sbuAliases: string[];
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  navMode: "kpi" | "resources";
  isDefault: boolean;
}

export function mapOnboardingVariant(row: OnboardingVariantRow): OnboardingVariant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    sbuAliases: row.sbu_aliases,
    logoUrl: row.logo_url,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    backgroundColor: row.background_color,
    navMode: row.nav_mode as "kpi" | "resources",
    isDefault: row.is_default,
  };
}

/**
 * A built-in default variant used only when the variants table can't be
 * read at all (network blip, permission gap) — otherwise `resolveVariantForSbu`
 * could return undefined and every caller that dereferences `.isDefault`
 * (login action, layouts, home page) would crash the render. Rendering with
 * this placeholder (default theme, default track) is strictly better than a
 * blank page; the next request retries the real query.
 */
export const SAFE_DEFAULT_VARIANT: OnboardingVariant = {
  id: "00000000-0000-0000-0000-000000000000",
  slug: "safe-default",
  name: "Default",
  sbuAliases: [],
  logoUrl: null,
  primaryColor: null,
  secondaryColor: null,
  accentColor: null,
  backgroundColor: null,
  navMode: "kpi",
  isDefault: true,
};

/**
 * Resolves which onboarding variant an employee belongs to, from their
 * PeopleDesk-sourced SBU string. Falls back to the default variant on no
 * match (unmapped/new SBU), so this can never leave an employee without a
 * variant — same fallback safety as findSbuAssignments returning []. If the
 * variants list itself is empty, falls back to SAFE_DEFAULT_VARIANT so this
 * function can never return undefined.
 */
export function resolveVariantForSbu(
  sbu: string | null | undefined,
  variants: OnboardingVariant[],
): OnboardingVariant {
  const fallback = variants.find((v) => v.isDefault) ?? variants[0] ?? SAFE_DEFAULT_VARIANT;
  if (!sbu) return fallback;

  const target = normalizeSbuName(sbu);
  const match = variants.find((v) => v.sbuAliases.some((a) => normalizeSbuName(a) === target));
  return match ?? fallback;
}
