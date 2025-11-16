import { describe, it, expect } from "vitest";
import {
  getFlashcardsQuerySchema,
  createFlashcardsSchema,
  updateFlashcardSchema,
  flashcardIdSchema,
  reviewFlashcardSchema,
} from "@/lib/validation/flashcard.schemas";

describe("flashcard.schemas", () => {
  describe("getFlashcardsQuerySchema", () => {
    it("should parse valid query parameters", () => {
      const result = getFlashcardsQuerySchema.parse({
        page: 1,
        limit: 50,
        search: "test",
        sort: "created_at",
        order: "desc",
      });

      expect(result).toEqual({
        page: 1,
        limit: 50,
        search: "test",
        sort: "created_at",
        order: "desc",
      });
    });

    it("should apply default values", () => {
      const result = getFlashcardsQuerySchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 50,
        sort: "created_at",
        order: "desc",
      });
    });

    it("should coerce string to number for page", () => {
      const result = getFlashcardsQuerySchema.parse({ page: "2" });
      expect(result.page).toBe(2);
    });

    it("should coerce string to number for limit", () => {
      const result = getFlashcardsQuerySchema.parse({ limit: "25" });
      expect(result.limit).toBe(25);
    });

    it("should reject negative page", () => {
      expect(() => getFlashcardsQuerySchema.parse({ page: -1 })).toThrow();
    });

    it("should reject zero page", () => {
      expect(() => getFlashcardsQuerySchema.parse({ page: 0 })).toThrow();
    });

    it("should reject limit over 100", () => {
      expect(() => getFlashcardsQuerySchema.parse({ limit: 101 })).toThrow();
    });

    it("should accept limit of exactly 100", () => {
      const result = getFlashcardsQuerySchema.parse({ limit: 100 });
      expect(result.limit).toBe(100);
    });

    it("should reject invalid sort field", () => {
      expect(() => getFlashcardsQuerySchema.parse({ sort: "invalid" })).toThrow();
    });

    it("should accept all valid sort fields", () => {
      const sorts = ["created_at", "updated_at", "front", "back"];
      sorts.forEach((sort) => {
        const result = getFlashcardsQuerySchema.parse({ sort });
        expect(result.sort).toBe(sort);
      });
    });

    it("should reject invalid order", () => {
      expect(() => getFlashcardsQuerySchema.parse({ order: "invalid" })).toThrow();
    });

    it("should accept asc and desc order", () => {
      expect(getFlashcardsQuerySchema.parse({ order: "asc" }).order).toBe("asc");
      expect(getFlashcardsQuerySchema.parse({ order: "desc" }).order).toBe("desc");
    });
  });

  describe("createFlashcardsSchema", () => {
    it("should parse valid flashcards array", () => {
      const input = {
        flashcards: [
          { front: "Q1", back: "A1", source: "manual" as const, generation_id: null },
          { front: "Q2", back: "A2", source: "ai_full" as const, generation_id: 1 },
        ],
      };

      const result = createFlashcardsSchema.parse(input);
      expect(result.flashcards).toHaveLength(2);
    });

    it("should reject empty flashcards array", () => {
      expect(() => createFlashcardsSchema.parse({ flashcards: [] })).toThrow();
    });

    it("should reject more than 50 flashcards", () => {
      const flashcards = Array(51)
        .fill(null)
        .map(() => ({ front: "Q", back: "A", source: "manual" as const }));
      expect(() => createFlashcardsSchema.parse({ flashcards })).toThrow();
    });

    it("should accept exactly 50 flashcards", () => {
      const flashcards = Array(50)
        .fill(null)
        .map(() => ({ front: "Q", back: "A", source: "manual" as const }));
      const result = createFlashcardsSchema.parse({ flashcards });
      expect(result.flashcards).toHaveLength(50);
    });

    it("should reject empty front", () => {
      const input = { flashcards: [{ front: "", back: "A", source: "manual" as const }] };
      expect(() => createFlashcardsSchema.parse(input)).toThrow();
    });

    it("should reject empty back", () => {
      const input = { flashcards: [{ front: "Q", back: "", source: "manual" as const }] };
      expect(() => createFlashcardsSchema.parse(input)).toThrow();
    });

    it("should reject front over 200 characters", () => {
      const input = { flashcards: [{ front: "a".repeat(201), back: "A", source: "manual" as const }] };
      expect(() => createFlashcardsSchema.parse(input)).toThrow();
    });

    it("should accept front of exactly 200 characters", () => {
      const input = { flashcards: [{ front: "a".repeat(200), back: "A", source: "manual" as const }] };
      const result = createFlashcardsSchema.parse(input);
      expect(result.flashcards[0].front).toHaveLength(200);
    });

    it("should reject back over 500 characters", () => {
      const input = { flashcards: [{ front: "Q", back: "a".repeat(501), source: "manual" as const }] };
      expect(() => createFlashcardsSchema.parse(input)).toThrow();
    });

    it("should accept back of exactly 500 characters", () => {
      const input = { flashcards: [{ front: "Q", back: "a".repeat(500), source: "manual" as const }] };
      const result = createFlashcardsSchema.parse(input);
      expect(result.flashcards[0].back).toHaveLength(500);
    });

    it("should reject invalid source", () => {
      const input = { flashcards: [{ front: "Q", back: "A", source: "invalid" }] };
      expect(() => createFlashcardsSchema.parse(input)).toThrow();
    });

    it("should accept all valid sources", () => {
      const sources = ["manual", "ai_full", "ai_edited"] as const;
      sources.forEach((source) => {
        const input = { flashcards: [{ front: "Q", back: "A", source }] };
        const result = createFlashcardsSchema.parse(input);
        expect(result.flashcards[0].source).toBe(source);
      });
    });
  });

  describe("updateFlashcardSchema", () => {
    it("should parse valid update with front only", () => {
      const result = updateFlashcardSchema.parse({ front: "Updated Q" });
      expect(result.front).toBe("Updated Q");
    });

    it("should parse valid update with back only", () => {
      const result = updateFlashcardSchema.parse({ back: "Updated A" });
      expect(result.back).toBe("Updated A");
    });

    it("should parse valid update with both fields", () => {
      const result = updateFlashcardSchema.parse({ front: "Updated Q", back: "Updated A" });
      expect(result.front).toBe("Updated Q");
      expect(result.back).toBe("Updated A");
    });

    it("should reject empty object", () => {
      expect(() => updateFlashcardSchema.parse({})).toThrow();
    });

    it("should reject empty front", () => {
      expect(() => updateFlashcardSchema.parse({ front: "" })).toThrow();
    });

    it("should reject empty back", () => {
      expect(() => updateFlashcardSchema.parse({ back: "" })).toThrow();
    });

    it("should reject front over 200 characters", () => {
      expect(() => updateFlashcardSchema.parse({ front: "a".repeat(201) })).toThrow();
    });

    it("should reject back over 500 characters", () => {
      expect(() => updateFlashcardSchema.parse({ back: "a".repeat(501) })).toThrow();
    });
  });

  describe("flashcardIdSchema", () => {
    it("should parse valid positive integer", () => {
      const result = flashcardIdSchema.parse(123);
      expect(result).toBe(123);
    });

    it("should coerce string to number", () => {
      const result = flashcardIdSchema.parse("456");
      expect(result).toBe(456);
    });

    it("should reject negative number", () => {
      expect(() => flashcardIdSchema.parse(-1)).toThrow();
    });

    it("should reject zero", () => {
      expect(() => flashcardIdSchema.parse(0)).toThrow();
    });

    it("should reject decimal number", () => {
      expect(() => flashcardIdSchema.parse(1.5)).toThrow();
    });
  });

  describe("reviewFlashcardSchema", () => {
    it("should parse valid review data", () => {
      const input = {
        rating: 3,
        srs_state: "Review",
        srs_due: "2024-01-15T00:00:00.000Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };

      const result = reviewFlashcardSchema.parse(input);
      expect(result).toEqual(input);
    });

    it("should reject rating below 1", () => {
      const input = {
        rating: 0,
        srs_state: "Review",
        srs_due: "2024-01-15T00:00:00.000Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };
      expect(() => reviewFlashcardSchema.parse(input)).toThrow();
    });

    it("should reject rating above 4", () => {
      const input = {
        rating: 5,
        srs_state: "Review",
        srs_due: "2024-01-15T00:00:00.000Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };
      expect(() => reviewFlashcardSchema.parse(input)).toThrow();
    });

    it("should accept all valid ratings (1-4)", () => {
      [1, 2, 3, 4].forEach((rating) => {
        const input = {
          rating,
          srs_state: "Review",
          srs_due: "2024-01-15T00:00:00.000Z",
          srs_stability: 10.5,
          srs_difficulty: 5.2,
          srs_elapsed_days: 5,
          srs_scheduled_days: 10,
          srs_reps: 3,
          srs_lapses: 1,
        };
        const result = reviewFlashcardSchema.parse(input);
        expect(result.rating).toBe(rating);
      });
    });

    it("should reject invalid srs_state", () => {
      const input = {
        rating: 3,
        srs_state: "Invalid",
        srs_due: "2024-01-15T00:00:00.000Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };
      expect(() => reviewFlashcardSchema.parse(input)).toThrow();
    });

    it("should accept all valid srs_states", () => {
      ["New", "Learning", "Review", "Relearning"].forEach((srs_state) => {
        const input = {
          rating: 3,
          srs_state,
          srs_due: "2024-01-15T00:00:00.000Z",
          srs_stability: 10.5,
          srs_difficulty: 5.2,
          srs_elapsed_days: 5,
          srs_scheduled_days: 10,
          srs_reps: 3,
          srs_lapses: 1,
        };
        const result = reviewFlashcardSchema.parse(input);
        expect(result.srs_state).toBe(srs_state);
      });
    });

    it("should reject invalid datetime format", () => {
      const input = {
        rating: 3,
        srs_state: "Review",
        srs_due: "invalid-date",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };
      expect(() => reviewFlashcardSchema.parse(input)).toThrow();
    });

    it("should reject negative elapsed_days", () => {
      const input = {
        rating: 3,
        srs_state: "Review",
        srs_due: "2024-01-15T00:00:00.000Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: -1,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
      };
      expect(() => reviewFlashcardSchema.parse(input)).toThrow();
    });
  });
});
