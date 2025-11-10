import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateGenerationLogDto, CreateGenerationResponseDto } from "../../types";

/**
 * Creates a generation log entry in the database.
 * Logs metadata about an AI generation event after user review.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to associate with the generation log
 * @param logData - Generation log data (model, duration, counts, etc.)
 * @returns The created generation log without user_id
 * @throws Error if database insertion fails
 */
export async function createGenerationLog(
  supabase: SupabaseClient,
  userId: string,
  logData: CreateGenerationLogDto
): Promise<CreateGenerationResponseDto> {
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      ...logData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create generation log: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from generation log creation");
  }

  // Remove user_id from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...response } = data;

  return response;
}
