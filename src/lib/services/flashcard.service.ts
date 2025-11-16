import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardDto,
  FlashcardDto,
  FlashcardWithSrsDto,
  GetDueFlashcardsResponseDto,
  GetFlashcardsQueryDto,
  GetFlashcardsResponseDto,
  ReviewFlashcardCommand,
  ReviewFlashcardResponseDto,
  UpdateFlashcardCommand,
} from "../../types";

/**
 * Fetches paginated flashcards with optional search and sorting.
 *
 * @param supabase - Supabase client instance
 * @param query - Query parameters (page, limit, search, sort, order)
 * @returns Paginated flashcards with metadata
 * @throws Error if database query fails
 */
export async function getFlashcards(
  supabase: SupabaseClient,
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
 * @param id - Flashcard ID to retrieve
 * @returns Flashcard object or null if not found
 * @throws Error if database query fails
 */
export async function getFlashcardById(supabase: SupabaseClient, id: number): Promise<FlashcardDto | null> {
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
 * @param id - Flashcard ID to update
 * @param updates - Fields to update (front and/or back)
 * @returns Updated flashcard or null if not found
 * @throws Error if database update fails
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
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
 * @param id - Flashcard ID to delete
 * @returns True if deleted, false if not found
 * @throws Error if database deletion fails
 */
export async function deleteFlashcard(supabase: SupabaseClient, id: number): Promise<boolean> {
  const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("id", id);

  if (error) {
    throw new Error(`Failed to delete flashcard: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Fetches all flashcards that are currently due for review.
 * RLS automatically filters by authenticated user.
 *
 * @param supabase - Supabase client instance
 * @returns Object with array of due flashcards and count
 * @throws Error if database query fails
 */
export async function getDueFlashcards(supabase: SupabaseClient): Promise<GetDueFlashcardsResponseDto> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .lte("srs_due", new Date().toISOString())
    .order("srs_due", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch due flashcards: ${error.message}`);
  }

  const flashcards = (data ?? []).map((card) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...rest } = card;
    return rest as FlashcardWithSrsDto;
  });

  return {
    data: flashcards,
    count: flashcards.length,
  };
}

/**
 * Updates a flashcard's SRS metadata after review.
 * RLS automatically filters by authenticated user.
 * Server sets last_reviewed to prevent client manipulation.
 *
 * @param supabase - Supabase client instance
 * @param id - Flashcard ID to update
 * @param reviewData - SRS metadata calculated by client (FSRS rating: 1=Forgot, 3=Knew)
 * @returns Updated flashcard with minimal fields or null if not found
 * @throws Error if database update fails
 */
export async function reviewFlashcard(
  supabase: SupabaseClient,
  id: number,
  reviewData: ReviewFlashcardCommand
): Promise<ReviewFlashcardResponseDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .update({
      srs_state: reviewData.srs_state,
      srs_due: reviewData.srs_due,
      srs_stability: reviewData.srs_stability,
      srs_difficulty: reviewData.srs_difficulty,
      srs_elapsed_days: reviewData.srs_elapsed_days,
      srs_scheduled_days: reviewData.srs_scheduled_days,
      srs_reps: reviewData.srs_reps,
      srs_lapses: reviewData.srs_lapses,
      last_reviewed: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, front, back, srs_state, srs_due, last_reviewed")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to review flashcard: ${error.message}`);
  }

  return data as ReviewFlashcardResponseDto;
}
