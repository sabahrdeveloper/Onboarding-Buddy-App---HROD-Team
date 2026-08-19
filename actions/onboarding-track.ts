"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_TRACK_COOKIE, isOnboardingTrack } from "@/lib/onboarding-track";

export async function chooseOnboardingTrack(formData: FormData) {
  const track = String(formData.get("track") ?? "");
  if (!isOnboardingTrack(track)) redirect("/select-onboarding");

  const cookieStore = await cookies();
  // Session cookie (no maxAge) — clears on browser close same as the
  // shortest-lived auth cookie state; sign-out also clears it explicitly so
  // a fresh login always re-asks, per the "every login" requirement.
  cookieStore.set(ONBOARDING_TRACK_COOKIE, track, { path: "/", sameSite: "lax" });
  redirect("/home");
}
