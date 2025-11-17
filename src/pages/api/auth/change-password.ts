import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { changePasswordSchema } from "../../../lib/validation/auth.schemas";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers }, locals.runtime?.env);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: locals.user.email,
      password: currentPassword,
    });

    if (signInError) {
      return new Response(JSON.stringify({ success: false, error: "Current password is incorrect" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      return new Response(JSON.stringify({ success: false, error: updateError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
