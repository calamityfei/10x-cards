import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getFlashcards,
  createFlashcards,
  getFlashcardById,
  updateFlashcard,
  deleteFlashcard,
  getDueFlashcards,
  reviewFlashcard,
} from "@/lib/services/flashcard.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { ReviewFlashcardCommand } from "@/types";

type MockSupabaseClient = Pick<SupabaseClient, "from"> & {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function createMockSupabase(): MockSupabaseClient {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  } as MockSupabaseClient;
}

describe("flashcard.service", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
  });

  describe("getFlashcards", () => {
    it("should fetch flashcards with pagination", async () => {
      const mockData = [
        {
          id: 1,
          front: "Q1",
          back: "A1",
          source: "manual",
          generation_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: 2,
          front: "Q2",
          back: "A2",
          source: "ai_full",
          generation_id: 1,
          created_at: "2024-01-02",
          updated_at: "2024-01-02",
        },
      ];

      mockSupabase.range.mockResolvedValue({ data: mockData, error: null, count: 2 });

      const result = await getFlashcards(mockSupabase as unknown as SupabaseClient, { page: 1, limit: 50 });

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockSupabase.select).toHaveBeenCalledWith(
        "id, front, back, source, generation_id, created_at, updated_at",
        { count: "exact" }
      );
      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({ currentPage: 1, totalPages: 1, totalCount: 2 });
    });

    it("should apply search filter", async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await getFlashcards(mockSupabase as unknown as SupabaseClient, { page: 1, limit: 50, search: "test" });

      expect(mockSupabase.or).toHaveBeenCalledWith("front.ilike.%test%,back.ilike.%test%");
    });

    it("should apply sorting", async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await getFlashcards(mockSupabase as unknown as SupabaseClient, {
        page: 1,
        limit: 50,
        sort: "front",
        order: "asc",
      });

      expect(mockSupabase.order).toHaveBeenCalledWith("front", { ascending: true });
    });

    it("should calculate correct pagination range", async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 });

      await getFlashcards(mockSupabase as unknown as SupabaseClient, { page: 2, limit: 50 });

      expect(mockSupabase.range).toHaveBeenCalledWith(50, 99);
    });

    it("should throw error on database failure", async () => {
      mockSupabase.range.mockResolvedValue({ data: null, error: { message: "DB error" }, count: null });

      await expect(getFlashcards(mockSupabase as unknown as SupabaseClient, { page: 1, limit: 50 })).rejects.toThrow(
        "Failed to fetch flashcards: DB error"
      );
    });

    it("should handle empty results", async () => {
      mockSupabase.range.mockResolvedValue({ data: [], error: null, count: 0 });

      const result = await getFlashcards(mockSupabase as unknown as SupabaseClient, { page: 1, limit: 50 });

      expect(result.data).toEqual([]);
      expect(result.pagination.totalCount).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe("createFlashcards", () => {
    it("should create flashcards with user_id", async () => {
      const flashcards = [
        { front: "Q1", back: "A1", source: "manual" as const, generation_id: null },
        { front: "Q2", back: "A2", source: "ai_full" as const, generation_id: 1 },
      ];

      const mockResponse = [
        {
          id: 1,
          front: "Q1",
          back: "A1",
          source: "manual",
          generation_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: 2,
          front: "Q2",
          back: "A2",
          source: "ai_full",
          generation_id: 1,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockSupabase.select.mockResolvedValue({ data: mockResponse, error: null });

      const result = await createFlashcards(mockSupabase as unknown as SupabaseClient, "user-123", flashcards);

      expect(mockSupabase.insert).toHaveBeenCalledWith([
        { ...flashcards[0], user_id: "user-123" },
        { ...flashcards[1], user_id: "user-123" },
      ]);
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on database failure", async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: { message: "Insert failed" } });

      await expect(createFlashcards(mockSupabase as unknown as SupabaseClient, "user-123", [])).rejects.toThrow(
        "Failed to create flashcards: Insert failed"
      );
    });

    it("should throw error when no data returned", async () => {
      mockSupabase.select.mockResolvedValue({ data: null, error: null });

      await expect(createFlashcards(mockSupabase as unknown as SupabaseClient, "user-123", [])).rejects.toThrow(
        "No data returned from flashcard creation"
      );
    });
  });

  describe("getFlashcardById", () => {
    it("should fetch flashcard by id", async () => {
      const mockCard = {
        id: 1,
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };
      mockSupabase.single.mockResolvedValue({ data: mockCard, error: null });

      const result = await getFlashcardById(mockSupabase as unknown as SupabaseClient, 1);

      expect(mockSupabase.eq).toHaveBeenCalledWith("id", 1);
      expect(result).toEqual(mockCard);
    });

    it("should return null when flashcard not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await getFlashcardById(mockSupabase as unknown as SupabaseClient, 999);

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: "DB error", code: "OTHER" } });

      await expect(getFlashcardById(mockSupabase as unknown as SupabaseClient, 1)).rejects.toThrow(
        "Failed to fetch flashcard: DB error"
      );
    });
  });

  describe("updateFlashcard", () => {
    it("should update flashcard", async () => {
      const mockCard = {
        id: 1,
        front: "Updated Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };
      mockSupabase.single.mockResolvedValue({ data: mockCard, error: null });

      const result = await updateFlashcard(mockSupabase as unknown as SupabaseClient, 1, { front: "Updated Q" });

      expect(mockSupabase.update).toHaveBeenCalledWith({ front: "Updated Q" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", 1);
      expect(result).toEqual(mockCard);
    });

    it("should return null when flashcard not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await updateFlashcard(mockSupabase as unknown as SupabaseClient, 999, { front: "Updated" });

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Update failed", code: "OTHER" } });

      await expect(updateFlashcard(mockSupabase as unknown as SupabaseClient, 1, { front: "Updated" })).rejects.toThrow(
        "Failed to update flashcard: Update failed"
      );
    });
  });

  describe("deleteFlashcard", () => {
    it("should delete flashcard and return true", async () => {
      mockSupabase.eq.mockResolvedValue({ error: null, count: 1 });

      const result = await deleteFlashcard(mockSupabase as unknown as SupabaseClient, 1);

      expect(mockSupabase.delete).toHaveBeenCalledWith({ count: "exact" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", 1);
      expect(result).toBe(true);
    });

    it("should return false when flashcard not found", async () => {
      mockSupabase.eq.mockResolvedValue({ error: null, count: 0 });

      const result = await deleteFlashcard(mockSupabase as unknown as SupabaseClient, 999);

      expect(result).toBe(false);
    });

    it("should throw error on database failure", async () => {
      mockSupabase.eq.mockResolvedValue({ error: { message: "Delete failed" }, count: null });

      await expect(deleteFlashcard(mockSupabase as unknown as SupabaseClient, 1)).rejects.toThrow(
        "Failed to delete flashcard: Delete failed"
      );
    });
  });

  describe("getDueFlashcards", () => {
    it("should fetch due flashcards and filter user_id", async () => {
      const mockData = [
        { id: 1, front: "Q1", back: "A1", user_id: "user-123", srs_due: "2024-01-01T00:00:00Z", srs_state: "Review" },
        {
          id: 2,
          front: "Q2",
          back: "A2",
          user_id: "user-123",
          srs_due: "2024-01-02T00:00:00Z",
          srs_state: "Learning",
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

      const result = await getDueFlashcards(mockSupabase as unknown as SupabaseClient);

      expect(mockSupabase.lte).toHaveBeenCalledWith("srs_due", expect.any(String));
      expect(mockSupabase.order).toHaveBeenCalledWith("srs_due", { ascending: true });
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).not.toHaveProperty("user_id");
      expect(result.count).toBe(2);
    });

    it("should handle empty results", async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await getDueFlashcards(mockSupabase as unknown as SupabaseClient);

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should throw error on database failure", async () => {
      mockSupabase.order.mockResolvedValue({ data: null, error: { message: "Query failed" } });

      await expect(getDueFlashcards(mockSupabase as unknown as SupabaseClient)).rejects.toThrow(
        "Failed to fetch due flashcards: Query failed"
      );
    });
  });

  describe("reviewFlashcard", () => {
    it("should update flashcard with review data", async () => {
      const reviewData = {
        rating: 3,
        srs_state: "Review",
        srs_due: "2024-02-01T00:00:00Z",
        srs_stability: 15.0,
        srs_difficulty: 5.0,
        srs_elapsed_days: 10,
        srs_scheduled_days: 20,
        srs_reps: 5,
        srs_lapses: 1,
      };

      const mockResponse = {
        id: 1,
        front: "Q",
        back: "A",
        srs_state: "Review",
        srs_due: "2024-02-01T00:00:00Z",
        last_reviewed: "2024-01-15T00:00:00Z",
      };

      mockSupabase.single.mockResolvedValue({ data: mockResponse, error: null });

      const result = await reviewFlashcard(mockSupabase as unknown as SupabaseClient, 1, reviewData);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          srs_state: "Review",
          srs_due: "2024-02-01T00:00:00Z",
          srs_stability: 15.0,
          srs_difficulty: 5.0,
          last_reviewed: expect.any(String),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return null when flashcard not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await reviewFlashcard(
        mockSupabase as unknown as SupabaseClient,
        999,
        {} as ReviewFlashcardCommand
      );

      expect(result).toBeNull();
    });

    it("should throw error on database failure", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: "Review failed", code: "OTHER" } });

      await expect(
        reviewFlashcard(mockSupabase as unknown as SupabaseClient, 1, {} as ReviewFlashcardCommand)
      ).rejects.toThrow("Failed to review flashcard: Review failed");
    });
  });
});
