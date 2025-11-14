import { useCreateFlashcards } from "@/hooks/useCreateFlashcards";
import { SourceTextInput } from "./SourceTextInput";
import { ManualAddButton } from "./ManualAddButton";
import { CandidateReviewList } from "./CandidateReviewList";
import { SaveAllButton } from "./SaveAllButton";
import { FlashcardAddEditModal } from "./FlashcardAddEditModal";
import { ConfirmRegenerateModal } from "./ConfirmRegenerateModal";
import { ConfirmPartialSaveModal } from "./ConfirmPartialSaveModal";

export default function CreateFlashcardsContainer() {
  const { state, handlers, computed } = useCreateFlashcards();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Create Flashcards</h1>
        </div>
        <ManualAddButton onClick={handlers.handleOpenManualAdd} disabled={state.isSaving} />
      </div>
      <p className="text-muted-foreground">
        Paste your study notes below and let AI generate flashcards, or create them manually.
      </p>

      <SourceTextInput
        value={state.sourceText}
        onChange={handlers.handleSourceTextChange}
        onGenerate={handlers.handleGenerate}
        isGenerating={state.isGenerating}
        disabled={state.isGenerating || state.isSaving}
      />

      <CandidateReviewList
        candidates={state.candidates}
        isLoading={state.isGenerating}
        error={state.error}
        onAccept={handlers.handleAccept}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
      />

      {computed.savableCards.length > 0 && (
        <SaveAllButton
          onClick={handlers.handleSaveAll}
          disabled={!computed.canSave}
          isSaving={state.isSaving}
          count={computed.savableCards.length}
        />
      )}

      <FlashcardAddEditModal
        isOpen={state.modalState.isOpen}
        mode={state.modalState.mode}
        initialData={state.modalState.initialData || undefined}
        onSave={handlers.handleModalSave}
        onCancel={handlers.handleModalCancel}
      />

      <ConfirmRegenerateModal
        isOpen={state.confirmRegenerateModalOpen}
        onConfirm={handlers.handleConfirmRegenerate}
        onCancel={handlers.handleCancelRegenerate}
      />

      <ConfirmPartialSaveModal
        isOpen={state.confirmPartialSaveModalOpen}
        unreviewedCount={computed.unreviewedAICandidatesCount}
        onConfirm={handlers.handleConfirmPartialSave}
        onCancel={handlers.handleCancelPartialSave}
      />
    </div>
  );
}
