"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";

const VERIFIER_KEY = "ob_google_pkce_verifier";

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get("code");
    const linked = params.get("linked") === "1";
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    if (!code) {
      router.replace("/login?error=google_no_code");
      return;
    }

    fetch("/api/auth/google-callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, verifier: verifier ?? "" }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({ ok: false, error: "exchange_failed" }));
        if (!res.ok || !data.ok) {
          const errorParam =
            data.error === "not_linked" ? "google_not_linked" : "google_exchange_failed";
          router.replace(`/login?error=${errorParam}`);
          return;
        }
        const cookieValue =
          "base64-" +
          btoa(JSON.stringify(data.session))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        document.cookie = `sb-wxazzkcwevsqqifglysc-auth-token=${cookieValue}; path=/; SameSite=Lax; Secure`;
        router.replace(linked ? "/profile" : "/home");
      })
      .catch(() => router.replace("/login?error=google_exchange_failed"));
  }, [router, params]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-bg px-6">
      <div className="h-24 w-24 animate-floaty">
        <Mascot variant="color" mood="happy" />
      </div>
      <p className="font-bn text-sm font-semibold text-muted">সাইন ইন সম্পন্ন হচ্ছে…</p>
    </div>
  );
}
