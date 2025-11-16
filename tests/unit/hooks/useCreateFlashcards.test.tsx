import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCreateFlashcards } from "@/hooks/useCreateFlashcards";
import * as flashcardsApi from "@/lib/api/flashcards";
import * as flashcardHelpers from "@/lib/utils/flashcard-helpers";
import { toast } from "sonner";

vi.mock("@/lib/api/flashcards");
vi.mock("@/lib/utils/flashcard-helpers");
vi.mock("sonner");

describe("useCreateFlashcards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(flashcardHelpers.generateClientId).mockReturnValue("test-id");
  });

  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useCreateFlashcards());

    expect(result.current.state.sourceText).toBe("");
    expect(result.current.state.candidates).toEqual([]);
    expect(result.current.state.isGenerating).toBe(false);
    expect(result.current.state.isSaving).toBe(false);
  });

  it("should update source text", () => {
    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("test text");
    });

    expect(result.current.state.sourceText).toBe("test text");
  });

  it("should validate source text length", () => {
    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(500));
    });

    expect(result.current.computed.isSourceTextValid).toBe(false);

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    expect(result.current.computed.isSourceTextValid).toBe(true);
  });

  it("should generate candidates successfully", async () => {
    const mockResponse = {
      candidates: [
        { front: "Q1", back: "A1" },
        { front: "Q2", back: "A2" },
      ],
      metadata: {
        model_used: "test-model",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.isGenerating).toBe(false));

    expect(result.current.state.candidates).toHaveLength(2);
    expect(toast.success).toHaveBeenCalled();
  });

  it("should handle generation error", async () => {
    vi.mocked(flashcardsApi.generateCandidates).mockRejectedValue(new Error("Generation failed"));

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.isGenerating).toBe(false));

    expect(result.current.state.error).toBe("Generation failed");
  });

  it("should accept candidate", async () => {
    const mockResponse = {
      candidates: [{ front: "Q", back: "A" }],
      metadata: {
        model_used: "test-model",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    const candidateId = result.current.state.candidates[0].id;

    act(() => {
      result.current.handlers.handleAccept(candidateId);
    });

    expect(result.current.state.candidates[0].status).toBe("accepted");
  });

  it("should delete candidate", async () => {
    const mockResponse = {
      candidates: [{ front: "Q", back: "A" }],
      metadata: {
        model_used: "test-model",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    const candidateId = result.current.state.candidates[0].id;

    act(() => {
      result.current.handlers.handleDelete(candidateId);
    });

    expect(result.current.state.candidates[0].status).toBe("deleted");
  });

  it("should add manual card", () => {
    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleOpenManualAdd();
    });

    expect(result.current.state.modalState.isOpen).toBe(true);
    expect(result.current.state.modalState.mode).toBe("add");

    act(() => {
      result.current.handlers.handleModalSave({ front: "Q", back: "A" });
    });

    expect(result.current.state.candidates).toHaveLength(1);
    expect(result.current.state.candidates[0].source).toBe("manual");
  });

  it("should edit candidate", async () => {
    const mockResponse = {
      candidates: [{ front: "Q", back: "A" }],
      metadata: {
        model_used: "test-model",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    const candidateId = result.current.state.candidates[0].id;

    act(() => {
      result.current.handlers.handleEdit(candidateId);
    });

    expect(result.current.state.modalState.isOpen).toBe(true);
    expect(result.current.state.modalState.mode).toBe("edit");

    act(() => {
      result.current.handlers.handleModalSave({ front: "Updated Q", back: "A" });
    });

    expect(result.current.state.candidates[0].front).toBe("Updated Q");
    expect(result.current.state.candidates[0].status).toBe("edited");
    expect(result.current.state.candidates[0].source).toBe("ai_edited");
  });

  it("should save flashcards successfully", async () => {
    const mockResponse = {
      candidates: [{ front: "Q", back: "A" }],
      metadata: {
        model_used: "test",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);
    vi.mocked(flashcardsApi.saveGenerationLog).mockResolvedValue({ id: 1 } as unknown as never);
    vi.mocked(flashcardsApi.saveFlashcards).mockResolvedValue({ flashcards: [] });
    vi.mocked(flashcardHelpers.computeGenerationMetrics).mockReturnValue({} as unknown as never);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    const candidateId = result.current.state.candidates[0].id;

    act(() => {
      result.current.handlers.handleAccept(candidateId);
    });

    await act(async () => {
      await result.current.handlers.handleSaveAll();
    });

    await waitFor(() => expect(result.current.state.isSaving).toBe(false));

    expect(toast.success).toHaveBeenCalled();
    expect(result.current.state.candidates).toEqual([]);
  });

  it("should calculate savable cards correctly", async () => {
    const mockResponse = {
      candidates: [{ front: "Q1", back: "A1" }],
      metadata: {
        model_used: "test",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    act(() => {
      result.current.handlers.handleAccept(result.current.state.candidates[0].id);
    });

    expect(result.current.computed.savableCards).toHaveLength(1);
    expect(result.current.computed.canSave).toBe(true);
  });

  it("should show confirmation modal when regenerating with existing AI candidates", async () => {
    const mockResponse = {
      candidates: [{ front: "Q1", back: "A1" }],
      metadata: {
        model_used: "test-model",
        generation_duration_ms: 1000,
        source_text_hash: "hash",
        source_text_length: 1000,
      },
    };

    vi.mocked(flashcardsApi.generateCandidates).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateFlashcards());

    act(() => {
      result.current.handlers.handleSourceTextChange("a".repeat(1000));
    });

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    await waitFor(() => expect(result.current.state.candidates).toHaveLength(1));

    await act(async () => {
      await result.current.handlers.handleGenerate();
    });

    expect(result.current.state.confirmRegenerateModalOpen).toBe(true);
  });
});
