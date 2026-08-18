import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both fresh Google sign-in and the redirect back after linking
// Google to an already-authenticated enroll-number account (see
// actions/auth.ts). Either way, the account is only valid here if a
// `profiles` row already exists for this auth user id — a brand-new,
// never-linked Google identity has no enroll number to attach to.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const linked = searchParams.get("linked") === "1";

  if (!code) return NextResponse.redirect(`${origin}/login?error=google_no_code`);

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(`${origin}/login?error=google_exchange_failed`);

  if (linked) return NextResponse.redirect(`${origin}/profile`);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("id").eq("id", userId).maybeSingle()
    : { data: null };

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=google_not_linked`);
  }

  return NextResponse.redirect(`${origin}/home`);
}
