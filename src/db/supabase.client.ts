import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../db/database.types.ts";

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export function createSupabaseServerInstance(
  context: { headers: Headers; cookies: AstroCookies },
  env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string }
) {
  const supabaseUrl = env?.SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = env?.SUPABASE_KEY ?? import.meta.env.SUPABASE_KEY;

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
}
