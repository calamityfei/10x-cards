import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardDto,
  FlashcardDto,
  GetFlashcardsQueryDto,
  GetFlashcardsResponseDto,
  UpdateFlashcardCommand,
} from "../../types";

/**
 * Fetches paginated flashcards with optional search and sorting.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID for RLS filtering
 * @param query - Query parameters (page, limit, search, sort, order)
 * @returns Paginated flashcards with metadata
 * @throws Error if database query fails
 */
export async function getFlashcards(
  supabase: SupabaseClient,
  userId: string,
  query: GetFlashcardsQueryDto
): Promise<GetFlashcardsResponseDto> {
  const { page = 1, limit = 50, search, sort = "created_at", order = "desc" } = query;

  let queryBuilder = supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" });

  if (search) {
    queryBuilder = queryBuilder.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
  }

  queryBuilder = queryBuilder.order(sort, { ascending: order === "asc" });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: (data as FlashcardDto[]) ?? [],
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
    },
  };
}

/**
 * Creates multiple flashcards in a batch.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to associate with flashcards
 * @param flashcards - Array of flashcard data to create
 * @returns Array of created flashcards with generated IDs
 * @throws Error if database insertion fails
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  flashcards: CreateFlashcardDto[]
): Promise<FlashcardDto[]> {
  const flashcardsWithUserId = flashcards.map((card) => ({
    ...card,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("flashcards")
    .insert(flashcardsWithUserId)
    .select("id, front, back, source, generation_id, created_at, updated_at");

  if (error) {
    throw new Error(`Failed to create flashcards: ${error.message}`);
  }

  if (!data) {
    throw new Error("No data returned from flashcard creation");
  }

  return data as FlashcardDto[];
}

/**
 * Fetches a single flashcard by ID.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID for RLS filtering
 * @param id - Flashcard ID to retrieve
 * @returns Flashcard object or null if not found
 * @throws Error if database query fails
 */
export async function getFlashcardById(
  supabase: SupabaseClient,
  userId: string,
  id: number
): Promise<FlashcardDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch flashcard: ${error.message}`);
  }

  return data as FlashcardDto;
}

/**
 * Updates a flashcard's front and/or back text.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID for RLS filtering
 * @param id - Flashcard ID to update
 * @param updates - Fields to update (front and/or back)
 * @returns Updated flashcard or null if not found
 * @throws Error if database update fails
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  userId: string,
  id: number,
  updates: UpdateFlashcardCommand
): Promise<FlashcardDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .update(updates)
    .eq("id", id)
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to update flashcard: ${error.message}`);
  }

  return data as FlashcardDto;
}

/**
 * Deletes a flashcard by ID.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID for RLS filtering
 * @param id - Flashcard ID to delete
 * @returns True if deleted, false if not found
 * @throws Error if database deletion fails
 */
export async function deleteFlashcard(supabase: SupabaseClient, userId: string, id: number): Promise<boolean> {
  const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("id", id);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
