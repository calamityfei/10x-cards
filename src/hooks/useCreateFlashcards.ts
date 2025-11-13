import { useState } from "react";
import type { GenerationMetadataDto } from "@/types";
import { generateCandidates, saveGenerationLog, saveFlashcards } from "@/lib/api/flashcards";
import { generateClientId, computeGenerationMetrics } from "@/lib/utils/flashcard-helpers";

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
  initialAICandidatesCount: number;
  error: string | null;
  modalState: {
    isOpen: boolean;
    mode: "add" | "edit";
    editingId: string | null;
    initialData: FlashcardFormData | null;
  };
  confirmRegenerateModalOpen: boolean;
}

export function useCreateFlashcards() {
  const [state, setState] = useState<CreateFlashcardsState>({
    sourceText: "",
    isGenerating: false,
    isSaving: false,
    candidates: [],
    generationMetadata: null,
    initialAICandidatesCount: 0,
    error: null,
    modalState: {
      isOpen: false,
      mode: "add",
      editingId: null,
      initialData: null,
    },
    confirmRegenerateModalOpen: false,
  });

  const handleSourceTextChange = (text: string) => {
    setState((prev) => ({ ...prev, sourceText: text, error: null }));
  };

  const handleGenerate = async () => {
    if (!isSourceTextValid) return;

    const hasAICandidates = state.candidates.some((c) => c.source.startsWith("ai"));
    if (hasAICandidates) {
      setState((prev) => ({ ...prev, confirmRegenerateModalOpen: true }));
      return;
    }

    executeGeneration();
  };

  const executeGeneration = async () => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null, confirmRegenerateModalOpen: false }));

    try {
      const data = await generateCandidates(state.sourceText);

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
        id: generateClientId(),
        front: candidate.front,
        back: candidate.back,
        status: "unreviewed" as const,
        source: "ai_full" as const,
        originalFront: candidate.front,
        originalBack: candidate.back,
      }));

      const manualCards = state.candidates.filter((c) => c.source === "manual");

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        candidates: [...candidateViewModels, ...manualCards],
        generationMetadata: data.metadata,
        initialAICandidatesCount: candidateViewModels.length,
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
      candidates: prev.candidates.map((c) => (c.id === id ? { ...c, status: "deleted" as const } : c)),
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
        id: generateClientId(),
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
        const metrics = computeGenerationMetrics(
          state.candidates,
          state.generationMetadata,
          state.initialAICandidatesCount
        );
        const genData = await saveGenerationLog({ generation_log: metrics });
        generationId = genData.id;
      }

      const flashcardsPayload = savableCards.map((card) => ({
        front: card.front,
        back: card.back,
        source: card.source,
        generation_id: card.source.startsWith("ai") ? generationId : null,
      }));

      await saveFlashcards({ flashcards: flashcardsPayload });

      resetState();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save cards. Please try again.";
      setState((prev) => ({ ...prev, isSaving: false, error: message }));
    }
  };

  const handleConfirmRegenerate = () => {
    executeGeneration();
  };

  const handleCancelRegenerate = () => {
    setState((prev) => ({ ...prev, confirmRegenerateModalOpen: false }));
  };

  const resetState = () => {
    setState({
      sourceText: "",
      isGenerating: false,
      isSaving: false,
      candidates: [],
      generationMetadata: null,
      initialAICandidatesCount: 0,
      error: null,
      modalState: {
        isOpen: false,
        mode: "add",
        editingId: null,
        initialData: null,
      },
      confirmRegenerateModalOpen: false,
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
      handleConfirmRegenerate,
      handleCancelRegenerate,
    },
    computed: {
      isSourceTextValid,
      savableCards,
      canSave,
    },
  };
}
