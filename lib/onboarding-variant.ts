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
 * Resolves which onboarding variant an employee belongs to, from their
 * PeopleDesk-sourced SBU string. Falls back to the default variant on no
 * match (unmapped/new SBU), so this can never leave an employee without a
 * variant — same fallback safety as findSbuAssignments returning [].
 */
export function resolveVariantForSbu(
  sbu: string | null | undefined,
  variants: OnboardingVariant[],
): OnboardingVariant {
  const fallback = variants.find((v) => v.isDefault) ?? variants[0];
  if (!sbu) return fallback;

  const target = normalizeSbuName(sbu);
  const match = variants.find((v) => v.sbuAliases.some((a) => normalizeSbuName(a) === target));
  return match ?? fallback;
}
