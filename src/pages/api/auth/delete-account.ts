import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { deleteAccountSchema } from "../../../lib/validation/auth.schemas";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, cookies, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { password } = deleteAccountSchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers }, locals.runtime?.env);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: locals.user.email,
      password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ success: false, error: "Password is incorrect" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: deleteError } = await supabase.rpc("delete_user");

    if (deleteError) {
      return new Response(JSON.stringify({ success: false, error: "Unable to delete account. Please try again" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await supabase.auth.signOut();

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
