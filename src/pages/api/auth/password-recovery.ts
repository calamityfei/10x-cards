import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { passwordRecoverySchema } from "../../../lib/validation/auth.schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url, locals }) => {
  try {
    const body = await request.json();
    const { email } = passwordRecoverySchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers }, locals.runtime?.env);
    const redirectTo = `${url.origin}/password-reset`;

    await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists, you will receive a password reset email",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ success: false, error: error.errors[0].message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
