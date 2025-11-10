import { createHash } from "crypto";
import type { FlashcardCandidateDto, GenerationMetadataDto } from "../../types";

export interface GenerationServiceResult {
  candidates: FlashcardCandidateDto[];
  metadata: GenerationMetadataDto;
}

/**
 * Generates flashcard candidates from source text using AI.
 * Currently uses mock data for development phase.
 */
export async function generateFlashcards(sourceText: string): Promise<GenerationServiceResult> {
  const startTime = Date.now();

  // Mock delay to simulate AI processing
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

  // Generate mock flashcards based on source text
  const candidates = generateMockCandidates(sourceText);

  const generationDuration = Date.now() - startTime;
  const sourceTextHash = createHash("md5").update(sourceText).digest("hex");

  return {
    candidates,
    metadata: {
      model_used: "mock/development-model",
      generation_duration_ms: generationDuration,
      source_text_length: sourceText.length,
      source_text_hash: sourceTextHash,
    },
  };
}

/**
 * Generates mock flashcard candidates for development.
 * Creates 5-10 cards with generic content.
 */
function generateMockCandidates(sourceText: string): FlashcardCandidateDto[] {
  const count = Math.floor(Math.random() * 6) + 5; // 5-10 cards
  const candidates: FlashcardCandidateDto[] = [];

  for (let i = 0; i < count; i++) {
    candidates.push({
      front: `Question ${i + 1} from the provided text?`,
      back: `Answer ${i + 1} based on the source material (${sourceText.substring(0, 50)}...)`,
    });
  }

  return candidates;
}
