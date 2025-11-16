import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const testEmail = process.env.E2E_USERNAME || "";
const testPassword = process.env.E2E_PASSWORD || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function cleanupDatabase() {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error("Error signing in:", signInError);
    throw signInError;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("flashcards").delete().eq("user_id", user.id);
  }
}
