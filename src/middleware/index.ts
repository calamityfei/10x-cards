import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/password-recovery",
  "/password-reset",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/password-recovery",
  "/api/auth/password-reset",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers }, locals.runtime?.env);
  locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email || "",
      id: user.id,
    };
  }

  const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

  if (user && (url.pathname === "/login" || url.pathname === "/register")) {
    return redirect("/my-flashcards");
  }

  if (!user && !isPublicPath) {
    return redirect("/login");
  }

  return next();
});
