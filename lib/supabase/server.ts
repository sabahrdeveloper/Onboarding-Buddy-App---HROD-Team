import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "./types";

// Cached per request: layout.tsx and page.tsx both call createClient() during
// the same render, and without this they'd each build a separate client.
// React.cache() doesn't affect correctness (nothing here is request-specific
// beyond the shared cookies) — it just means one client gets reused.
//
// `remember` only matters at the moment auth cookies are actually written
// (i.e. from the login action) — every other call site omits it and keeps
// today's persistent-cookie behavior. When false, it strips maxAge/expires
// from the Supabase-issued cookies so they become session cookies (cleared
// when the browser closes) while keeping every other attribute (httpOnly,
// secure, sameSite, path) exactly as Supabase set them.
export const createClient = cache(async (opts?: { remember?: boolean }) => {
  const remember = opts?.remember ?? true;
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              const finalOptions = remember ? options : { ...options, maxAge: undefined, expires: undefined };
              cookieStore.set(name, value, finalOptions);
            }
          } catch {
            // setAll called from a Server Component (no request context) — safe to
            // ignore since middleware/actions handle session refresh on writes.
          }
        },
      },
    },
  );
});
