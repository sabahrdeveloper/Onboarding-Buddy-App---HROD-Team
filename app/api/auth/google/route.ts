import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const origin = req.headers.get("x-forwarded-proto")
    ? `${req.headers.get("x-forwarded-proto")}://${req.headers.get("host")}`
    : req.nextUrl.origin;

  // Manual PKCE flow — avoids supabase-js storing the code_verifier in a
  // cookie, because the edge proxy breaks any response that sets cookies.
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());

  const params = new URLSearchParams({
    provider: "google",
    redirect_to: `${origin}/auth/callback`,
    code_challenge: challenge,
    code_challenge_method: "s256",
  });

  return NextResponse.json({ ok: true, url: `${supabaseUrl}/auth/v1/authorize?${params}`, verifier });
}
