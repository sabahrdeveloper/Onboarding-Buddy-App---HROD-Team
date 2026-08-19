export const ONBOARDING_TRACK_COOKIE = "ob_track";
export type OnboardingTrack = "org" | "sales";

export function isOnboardingTrack(value: string | undefined): value is OnboardingTrack {
  return value === "org" || value === "sales";
}
