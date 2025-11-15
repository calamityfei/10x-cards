import { z } from "zod";

export const FlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
});

export const OpenRouterFlashcardResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1).max(50),
});

export type ValidatedFlashcardResponse = z.infer<typeof OpenRouterFlashcardResponseSchema>;
