import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { Rating } from "ts-fsrs";
import { useStudySession } from "@/hooks/useStudySession";
import * as fsrsUtils from "@/lib/utils/fsrs";

vi.mock("@/lib/utils/fsrs");

describe("useStudySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should start in loading state", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], count: 0 }),
    } as Response);

    const { result } = renderHook(() => useStudySession());

    expect(result.current.state.status).toBe("loading");

    await waitFor(() => expect(result.current.state.status).not.toBe("loading"));
  });

  it("should transition to empty state when no cards", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], count: 0 }),
    } as Response);

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("empty"));
    expect(result.current.state.cards).toEqual([]);
  });

  it("should transition to active state with cards", async () => {
    const mockCards = [
      {
        id: 1,
        front: "Q1",
        back: "A1",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCards, count: 1 }),
    } as Response);

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("active"));
    expect(result.current.state.cards).toEqual(mockCards);
    expect(result.current.state.currentIndex).toBe(0);
  });

  it("should handle fetch error", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state.error).toBe("Failed to load flashcards. Please try again.");
  });

  it("should show answer when showAnswer is called", async () => {
    const mockCards = [
      {
        id: 1,
        front: "Q1",
        back: "A1",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCards, count: 1 }),
    } as Response);

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("active"));

    act(() => {
      result.current.showAnswer();
    });

    expect(result.current.state.isAnswerRevealed).toBe(true);
  });

  it("should grade card and update stats", async () => {
    const mockCards = [
      {
        id: 1,
        front: "Q1",
        back: "A1",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCards, count: 1 }),
    } as Response);

    const mockFSRS = { repeat: vi.fn() };
    const mockCard = { state: 0, due: new Date(), stability: 1, difficulty: 5, reps: 1, lapses: 0 };
    const mockRecordLog = {
      [Rating.Good]: { card: mockCard },
    };

    vi.mocked(fsrsUtils.initializeFSRS).mockReturnValue(mockFSRS as unknown as never);
    vi.mocked(fsrsUtils.convertToFSRSCard).mockReturnValue(mockCard as unknown as never);
    vi.mocked(mockFSRS.repeat).mockReturnValue(mockRecordLog as unknown as never);
    vi.mocked(fsrsUtils.buildReviewCommand).mockReturnValue({
      rating: Rating.Good,
      srs_state: "Learning",
      srs_due: "2024-01-02T00:00:00Z",
      srs_stability: 1,
      srs_difficulty: 5,
      srs_elapsed_days: 0,
      srs_scheduled_days: 1,
      srs_reps: 1,
      srs_lapses: 0,
    });

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("active"));

    act(() => {
      result.current.showAnswer();
    });

    await act(async () => {
      await result.current.gradeCard(Rating.Good);
    });

    expect(result.current.state.stats.totalReviewed).toBe(1);
    expect(result.current.state.stats.knewCount).toBe(1);
    expect(result.current.state.currentIndex).toBe(1);
  });

  it("should transition to complete when all cards reviewed", async () => {
    const mockCards = [
      {
        id: 1,
        front: "Q1",
        back: "A1",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCards, count: 1 }),
    } as Response);

    const mockFSRS = { repeat: vi.fn() };
    const mockCard = { state: 0, due: new Date(), stability: 1, difficulty: 5, reps: 1, lapses: 0 };
    const mockRecordLog = {
      [Rating.Good]: { card: mockCard },
    };

    vi.mocked(fsrsUtils.initializeFSRS).mockReturnValue(mockFSRS as unknown as never);
    vi.mocked(fsrsUtils.convertToFSRSCard).mockReturnValue(mockCard as unknown as never);
    vi.mocked(mockFSRS.repeat).mockReturnValue(mockRecordLog as unknown as never);
    vi.mocked(fsrsUtils.buildReviewCommand).mockReturnValue({
      rating: Rating.Good,
      srs_state: "Learning",
      srs_due: "2024-01-02T00:00:00Z",
      srs_stability: 1,
      srs_difficulty: 5,
      srs_elapsed_days: 0,
      srs_scheduled_days: 1,
      srs_reps: 1,
      srs_lapses: 0,
    });

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("active"));

    act(() => {
      result.current.showAnswer();
    });

    await act(async () => {
      await result.current.gradeCard(Rating.Good);
    });

    await waitFor(() => expect(result.current.state.status).toBe("complete"));
  });

  it("should retry fetching cards", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    const { result } = renderHook(() => useStudySession());

    await waitFor(() => expect(result.current.state.status).toBe("error"));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], count: 0 }),
    } as Response);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.state.status).toBe("empty"));
  });
});
