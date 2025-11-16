import { describe, it, expect, vi } from "vitest";
import { generateClientId, computeGenerationMetrics, validateFlashcardForm } from "@/lib/utils/flashcard-helpers";
import type { CandidateCardViewModel } from "@/hooks/useCreateFlashcards";
import type { GenerationMetadataDto } from "@/types";

describe("flashcard-helpers", () => {
  describe("generateClientId", () => {
    it("should generate a valid UUID", () => {
      const id = generateClientId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("should generate unique IDs on consecutive calls", () => {
      const id1 = generateClientId();
      const id2 = generateClientId();
      expect(id1).not.toBe(id2);
    });

    it("should use crypto.randomUUID", () => {
      const spy = vi.spyOn(crypto, "randomUUID");
      generateClientId();
      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });
  });

  describe("computeGenerationMetrics", () => {
    const mockMetadata: GenerationMetadataDto = {
      model_used: "anthropic/claude-3-haiku",
      generation_duration_ms: 1500,
      source_text_hash: "abc123",
      source_text_length: 5000,
    };

    it("should compute metrics for all accepted unedited cards", () => {
      const candidates: CandidateCardViewModel[] = [
        { id: "1", front: "Q1", back: "A1", status: "accepted", source: "ai_full" },
        { id: "2", front: "Q2", back: "A2", status: "accepted", source: "ai_full" },
      ];

      const result = computeGenerationMetrics(candidates, mockMetadata, 2);

      expect(result).toEqual({
        model: "anthropic/claude-3-haiku",
        generation_duration: 1500,
        source_text_hash: "abc123",
        source_text_length: 5000,
        generated_count: 2,
        accepted_unedited_count: 2,
        accepted_edited_count: 0,
        deleted_count: 0,
      });
    });

    it("should compute metrics for edited cards", () => {
      const candidates: CandidateCardViewModel[] = [
        { id: "1", front: "Q1", back: "A1", status: "edited", source: "ai_edited" },
        { id: "2", front: "Q2", back: "A2", status: "edited", source: "ai_edited" },
      ];

      const result = computeGenerationMetrics(candidates, mockMetadata, 2);

      expect(result.accepted_unedited_count).toBe(0);
      expect(result.accepted_edited_count).toBe(2);
      expect(result.deleted_count).toBe(0);
    });

    it("should count unreviewed cards as deleted", () => {
      const candidates: CandidateCardViewModel[] = [
        { id: "1", front: "Q1", back: "A1", status: "unreviewed", source: "ai_full" },
        { id: "2", front: "Q2", back: "A2", status: "deleted", source: "ai_full" },
      ];

      const result = computeGenerationMetrics(candidates, mockMetadata, 2);

      expect(result.deleted_count).toBe(2);
    });

    it("should ignore manual cards in metrics", () => {
      const candidates: CandidateCardViewModel[] = [
        { id: "1", front: "Q1", back: "A1", status: "accepted", source: "ai_full" },
        { id: "2", front: "Q2", back: "A2", status: "accepted", source: "manual" },
      ];

      const result = computeGenerationMetrics(candidates, mockMetadata, 1);

      expect(result.accepted_unedited_count).toBe(1);
      expect(result.generated_count).toBe(1);
    });

    it("should handle mixed card statuses", () => {
      const candidates: CandidateCardViewModel[] = [
        { id: "1", front: "Q1", back: "A1", status: "accepted", source: "ai_full" },
        { id: "2", front: "Q2", back: "A2", status: "edited", source: "ai_edited" },
        { id: "3", front: "Q3", back: "A3", status: "deleted", source: "ai_full" },
        { id: "4", front: "Q4", back: "A4", status: "unreviewed", source: "ai_full" },
      ];

      const result = computeGenerationMetrics(candidates, mockMetadata, 4);

      expect(result.accepted_unedited_count).toBe(1);
      expect(result.accepted_edited_count).toBe(1);
      expect(result.deleted_count).toBe(2);
    });

    it("should handle empty candidates array", () => {
      const result = computeGenerationMetrics([], mockMetadata, 0);

      expect(result.accepted_unedited_count).toBe(0);
      expect(result.accepted_edited_count).toBe(0);
      expect(result.deleted_count).toBe(0);
    });
  });

  describe("validateFlashcardForm", () => {
    it("should return true for valid form data", () => {
      const validData = { front: "Question", back: "Answer" };
      expect(validateFlashcardForm(validData)).toBe(true);
    });

    it("should return false when front is empty", () => {
      const invalidData = { front: "", back: "Answer" };
      expect(validateFlashcardForm(invalidData)).toBe(false);
    });

    it("should return false when back is empty", () => {
      const invalidData = { front: "Question", back: "" };
      expect(validateFlashcardForm(invalidData)).toBe(false);
    });

    it("should return false when front exceeds 200 characters", () => {
      const invalidData = { front: "a".repeat(201), back: "Answer" };
      expect(validateFlashcardForm(invalidData)).toBe(false);
    });

    it("should return false when back exceeds 500 characters", () => {
      const invalidData = { front: "Question", back: "a".repeat(501) };
      expect(validateFlashcardForm(invalidData)).toBe(false);
    });

    it("should return true when front is exactly 200 characters", () => {
      const validData = { front: "a".repeat(200), back: "Answer" };
      expect(validateFlashcardForm(validData)).toBe(true);
    });

    it("should return true when back is exactly 500 characters", () => {
      const validData = { front: "Question", back: "a".repeat(500) };
      expect(validateFlashcardForm(validData)).toBe(true);
    });

    it("should return true when front is 1 character", () => {
      const validData = { front: "Q", back: "Answer" };
      expect(validateFlashcardForm(validData)).toBe(true);
    });

    it("should return true when back is 1 character", () => {
      const validData = { front: "Question", back: "A" };
      expect(validateFlashcardForm(validData)).toBe(true);
    });
  });
});
