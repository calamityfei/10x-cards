import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlashcards } from "@/hooks/useFlashcards";
import * as flashcardsApi from "@/lib/api/flashcards";

vi.mock("@/lib/api/flashcards");

describe("useFlashcards", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch flashcards successfully", async () => {
    const mockData = {
      data: [
        {
          id: 1,
          front: "Q",
          back: "A",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          srs_state: null,
          srs_due: null,
          srs_stability: null,
          srs_difficulty: null,
          srs_elapsed_days: null,
          srs_scheduled_days: null,
          srs_reps: null,
          srs_lapses: null,
          last_reviewed: null,
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalCount: 1 },
    };

    vi.mocked(flashcardsApi.fetchFlashcards).mockResolvedValue(mockData);

    const { result } = renderHook(() => useFlashcards({ page: 1, limit: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.flashcards).toEqual(mockData.data);
    expect(result.current.pagination).toEqual(mockData.pagination);
  });

  it("should handle fetch error", async () => {
    vi.mocked(flashcardsApi.fetchFlashcards).mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useFlashcards({ page: 1, limit: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.flashcards).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it("should return empty array when data is undefined", async () => {
    vi.mocked(flashcardsApi.fetchFlashcards).mockResolvedValue({
      data: [],
      pagination: { currentPage: 1, totalPages: 0, totalCount: 0 },
    });

    const { result } = renderHook(() => useFlashcards({ page: 1, limit: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.flashcards).toEqual([]);
  });

  it("should update flashcard and invalidate queries", async () => {
    const mockData = {
      data: [
        {
          id: 1,
          front: "Q",
          back: "A",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          srs_state: null,
          srs_due: null,
          srs_stability: null,
          srs_difficulty: null,
          srs_elapsed_days: null,
          srs_scheduled_days: null,
          srs_reps: null,
          srs_lapses: null,
          last_reviewed: null,
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalCount: 1 },
    };

    vi.mocked(flashcardsApi.fetchFlashcards).mockResolvedValue(mockData);
    vi.mocked(flashcardsApi.updateFlashcard).mockResolvedValue({
      id: 1,
      front: "Updated",
      back: "A",
      source: "manual" as const,
      generation_id: null,
      created_at: "2024-01-01",
      updated_at: "2024-01-02",
      srs_state: null,
      srs_due: null,
      srs_stability: null,
      srs_difficulty: null,
      srs_elapsed_days: null,
      srs_scheduled_days: null,
      srs_reps: null,
      srs_lapses: null,
      last_reviewed: null,
    });

    const { result } = renderHook(() => useFlashcards({ page: 1, limit: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.updateFlashcard({ id: 1, data: { front: "Updated" } });

    await waitFor(() => expect(result.current.isUpdating).toBe(false));

    expect(flashcardsApi.updateFlashcard).toHaveBeenCalledWith(1, { front: "Updated" });
  });

  it("should delete flashcard and invalidate queries", async () => {
    const mockData = {
      data: [
        {
          id: 1,
          front: "Q",
          back: "A",
          source: "manual" as const,
          generation_id: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          srs_state: null,
          srs_due: null,
          srs_stability: null,
          srs_difficulty: null,
          srs_elapsed_days: null,
          srs_scheduled_days: null,
          srs_reps: null,
          srs_lapses: null,
          last_reviewed: null,
        },
      ],
      pagination: { currentPage: 1, totalPages: 1, totalCount: 1 },
    };

    vi.mocked(flashcardsApi.fetchFlashcards).mockResolvedValue(mockData);
    vi.mocked(flashcardsApi.deleteFlashcard).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFlashcards({ page: 1, limit: 50 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteFlashcard(1);

    await waitFor(() => expect(result.current.isDeleting).toBe(false));

    expect(flashcardsApi.deleteFlashcard).toHaveBeenCalledWith(1);
  });
});
