import type { CandidateCardViewModel } from "@/hooks/useCreateFlashcards";
import type { FlashcardFormData } from "@/hooks/useCreateFlashcards";
import type { GenerationMetadataDto } from "@/types";

export function generateClientId(): string {
  return crypto.randomUUID();
}

export function computeGenerationMetrics(candidates: CandidateCardViewModel[], metadata: GenerationMetadataDto) {
  const aiCandidates = candidates.filter((c) => c.source.startsWith("ai"));
  const acceptedUnedited = aiCandidates.filter((c) => c.status === "accepted" && c.source === "ai_full").length;
  const acceptedEdited = aiCandidates.filter((c) => c.status === "edited" && c.source === "ai_edited").length;
  const deleted = aiCandidates.filter((c) => c.status === "deleted").length;

  return {
    model: metadata.model_used,
    generation_duration: metadata.generation_duration_ms,
    source_text_hash: metadata.source_text_hash,
    source_text_length: metadata.source_text_length,
    generated_count: aiCandidates.length,
    accepted_unedited_count: acceptedUnedited,
    accepted_edited_count: acceptedEdited,
    deleted_count: deleted,
  };
}

export function validateFlashcardForm(data: FlashcardFormData): boolean {
  return data.front.length > 0 && data.front.length <= 200 && data.back.length > 0 && data.back.length <= 500;
}
