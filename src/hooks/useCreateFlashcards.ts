import { useState } from "react";
import type { GenerateCandidatesResponseDto, GenerationMetadataDto, CreateGenerationResponseDto } from "@/types";

export interface CandidateCardViewModel {
  id: string;
  front: string;
  back: string;
  status: "unreviewed" | "accepted" | "edited" | "deleted";
  source: "ai_full" | "ai_edited" | "manual";
  originalFront?: string;
  originalBack?: string;
}

export interface FlashcardFormData {
  front: string;
  back: string;
}

interface CreateFlashcardsState {
  sourceText: string;
  isGenerating: boolean;
  isSaving: boolean;
  candidates: CandidateCardViewModel[];
  generationMetadata: GenerationMetadataDto | null;
  error: string | null;
  modalState: {
    isOpen: boolean;
    mode: "add" | "edit";
    editingId: string | null;
    initialData: FlashcardFormData | null;
  };
}

export function useCreateFlashcards() {
  const [state, setState] = useState<CreateFlashcardsState>({
    sourceText: "",
    isGenerating: false,
    isSaving: false,
    candidates: [],
    generationMetadata: null,
    error: null,
    modalState: {
      isOpen: false,
      mode: "add",
      editingId: null,
      initialData: null,
    },
  });

  const handleSourceTextChange = (text: string) => {
    setState((prev) => ({ ...prev, sourceText: text, error: null }));
  };

  const handleGenerate = async () => {
    if (!isSourceTextValid) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await fetch("/api/generations/generate-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: state.sourceText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Generation failed");
      }

      const data: GenerateCandidatesResponseDto = await response.json();

      if (data.candidates.length === 0) {
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          error:
            "We couldn't find any factual items to create cards from. This tool works best with definitions and key terms. Please adjust the text and try again.",
        }));
        return;
      }

      const candidateViewModels: CandidateCardViewModel[] = data.candidates.map((candidate) => ({
        id: crypto.randomUUID(),
        front: candidate.front,
        back: candidate.back,
        status: "unreviewed" as const,
        source: "ai_full" as const,
        originalFront: candidate.front,
        originalBack: candidate.back,
      }));

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        candidates: candidateViewModels,
        generationMetadata: data.metadata,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setState((prev) => ({ ...prev, isGenerating: false, error: message }));
    }
  };

  const handleAccept = (id: string) => {
    setState((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === id ? { ...c, status: "accepted" as const, source: "ai_full" as const } : c
      ),
    }));
  };

  const handleEdit = (id: string) => {
    const candidate = state.candidates.find((c) => c.id === id);
    if (!candidate) return;

    setState((prev) => ({
      ...prev,
      modalState: {
        isOpen: true,
        mode: "edit",
        editingId: id,
        initialData: { front: candidate.front, back: candidate.back },
      },
    }));
  };

  const handleDelete = (id: string) => {
    setState((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }));
  };

  const handleOpenManualAdd = () => {
    setState((prev) => ({
      ...prev,
      modalState: {
        isOpen: true,
        mode: "add",
        editingId: null,
        initialData: null,
      },
    }));
  };

  const handleModalSave = (data: FlashcardFormData) => {
    if (state.modalState.mode === "edit" && state.modalState.editingId) {
      setState((prev) => ({
        ...prev,
        candidates: prev.candidates.map((c) =>
          c.id === prev.modalState.editingId
            ? { ...c, front: data.front, back: data.back, status: "edited" as const, source: "ai_edited" as const }
            : c
        ),
        modalState: { isOpen: false, mode: "add", editingId: null, initialData: null },
      }));
    } else {
      const newCard: CandidateCardViewModel = {
        id: crypto.randomUUID(),
        front: data.front,
        back: data.back,
        status: "accepted",
        source: "manual",
      };
      setState((prev) => ({
        ...prev,
        candidates: [...prev.candidates, newCard],
        modalState: { isOpen: false, mode: "add", editingId: null, initialData: null },
      }));
    }
  };

  const handleModalCancel = () => {
    setState((prev) => ({
      ...prev,
      modalState: { isOpen: false, mode: "add", editingId: null, initialData: null },
    }));
  };

  const handleSaveAll = async () => {
    if (!canSave) return;

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      let generationId: number | null = null;

      const hasAICandidates = savableCards.some((c) => c.source.startsWith("ai"));

      if (hasAICandidates && state.generationMetadata) {
        const metrics = computeGenerationMetrics(state.candidates, state.generationMetadata);
        const genResponse = await fetch("/api/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generation_log: metrics }),
        });

        if (!genResponse.ok) {
          throw new Error("Failed to save generation log");
        }

        const genData: CreateGenerationResponseDto = await genResponse.json();
        generationId = genData.id;
      }

      const flashcardsPayload = savableCards.map((card) => ({
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.source.startsWith("ai") ? generationId : null,
      }));

      const flashcardsResponse = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcards: flashcardsPayload }),
      });

      if (!flashcardsResponse.ok) {
        throw new Error("Failed to save flashcards");
      }

      await flashcardsResponse.json();

      resetState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save cards. Please try again.";
      setState((prev) => ({ ...prev, isSaving: false, error: message }));
    }
  };

  const resetState = () => {
    setState({
      sourceText: "",
      isGenerating: false,
      isSaving: false,
      candidates: [],
      generationMetadata: null,
      error: null,
      modalState: {
        isOpen: false,
        mode: "add",
        editingId: null,
        initialData: null,
      },
    });
  };

  const isSourceTextValid = state.sourceText.length >= 1000 && state.sourceText.length <= 10000;
  const savableCards = state.candidates.filter((c) => c.status === "accepted" || c.status === "edited");
  const canSave = savableCards.length > 0 && !state.isSaving;

  return {
    state,
    handlers: {
      handleSourceTextChange,
      handleGenerate,
      handleAccept,
      handleEdit,
      handleDelete,
      handleOpenManualAdd,
      handleModalSave,
      handleModalCancel,
      handleSaveAll,
    },
    computed: {
      isSourceTextValid,
      savableCards,
      canSave,
    },
  };
}

function computeGenerationMetrics(candidates: CandidateCardViewModel[], metadata: GenerationMetadataDto) {
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
