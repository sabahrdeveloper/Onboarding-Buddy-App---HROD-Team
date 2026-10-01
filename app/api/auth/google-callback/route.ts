import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  let body: { code?: string; verifier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const code = body?.code;
  const verifier = body?.verifier;
  if (!code || !verifier) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
    user: { id: string };
  } | null = null;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    const data = await res.json();
    if (!res.ok || !data.access_token) {
      return NextResponse.json({ ok: false, error: "exchange_failed" }, { status: 400 });
    }
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      token_type: data.token_type ?? "bearer",
      user: { id: data.user?.id ?? "" },
    };
  } catch {
    return NextResponse.json({ ok: false, error: "exchange_failed" }, { status: 500 });
  }

  if (!session || !session.user.id) {
    return NextResponse.json({ ok: false, error: "exchange_failed" }, { status: 500 });
  }

  // A fresh Google sign-in with no matching enroll-number profile has no
  // valid use — remove the auth row so a later real linkGoogleAccount can
  // still claim this Google identity.
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
    if (!profile) {
      await admin.auth.admin.deleteUser(session.user.id);
      return NextResponse.json({ ok: false, error: "not_linked" }, { status: 403 });
    }
  } catch {
    // Keep the session even if the profile check fails — the app pages
    // redirect to /login when there is no usable profile anyway.
  }

  return NextResponse.json({
    ok: true,
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: session.token_type,
    },
  });
}
