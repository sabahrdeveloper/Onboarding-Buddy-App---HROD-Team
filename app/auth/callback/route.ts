import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Handles both fresh Google sign-in and the redirect back after linking
// Google to an already-authenticated enroll-number account (see
// actions/auth.ts). Either way, the account is only valid here if a
// `profiles` row already exists for this auth user id — a brand-new,
// never-linked Google identity has no enroll number to attach to.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Never derive the origin from request.url's own host — behind OpenShip's
  // reverse proxy that's the container's internal address (localhost:3000),
  // not the public domain, so every redirect below sent the browser to a
  // dead localhost URL instead of back to the real site. Same class of bug
  // already fixed in actions/auth.ts's siteOrigin().
  const origin = `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;
  const code = searchParams.get("code");
  const linked = searchParams.get("linked") === "1";

  if (!code) return NextResponse.redirect(`${origin}/login?error=google_no_code`);

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    // TEMPORARY: surfacing the real reason while diagnosing a production
    // failure here — revert to the generic error once resolved, this isn't
    // meant to stay (exposes Supabase's internal error message in the URL).
    return NextResponse.redirect(`${origin}/login?error=google_exchange_failed&detail=${encodeURIComponent(exchangeError.message)}`);
  }

  if (linked) return NextResponse.redirect(`${origin}/profile`);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("id").eq("id", userId).maybeSingle()
    : { data: null };

  if (!profile) {
    // A fresh Google sign-in with no matching enroll number has no valid use —
    // leaving the auth.users row behind would permanently claim this Google
    // identity, so a later real `linkGoogleAccount` attempt would fail with
    // identity_already_exists even though nothing actually uses that account.
    await supabase.auth.signOut();
    if (userId) await createAdminClient().auth.admin.deleteUser(userId);
    return NextResponse.redirect(`${origin}/login?error=google_not_linked`);
  }

  return NextResponse.redirect(`${origin}/home`);
}
