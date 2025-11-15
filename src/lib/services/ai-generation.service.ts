import { getOpenRouterService, type GenerationServiceResult } from "./openrouter.service";
import type { GenerationOptions } from "./openrouter.types";

/**
 * Generates flashcard candidates from source text using AI.
 * Uses OpenRouter API to generate high-quality flashcards.
 * @param sourceText - The source text to generate flashcards from (1,000-10,000 characters)
 * @param options - Optional generation configuration (model, maxCards, temperature)
 * @returns Promise resolving to flashcard candidates and generation metadata
 * @throws {Error} User-friendly error message for all failure scenarios
 */
export async function generateFlashcards(
  sourceText: string,
  options?: GenerationOptions
): Promise<GenerationServiceResult> {
  const service = getOpenRouterService();
  return await service.generateFlashcards(sourceText, options);
}
