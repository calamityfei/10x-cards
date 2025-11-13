import { FlashCard } from "./FlashCard";
import type { CandidateCardViewModel } from "@/hooks/useCreateFlashcards";

interface CandidateCardProps {
  candidate: CandidateCardViewModel;
  onAccept: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CandidateCard({ candidate, onAccept, onEdit, onDelete }: CandidateCardProps) {
  const isUnreviewed = candidate.status === "unreviewed";

  return (
    <FlashCard
      front={candidate.front}
      back={candidate.back}
      isUnreviewed={isUnreviewed}
      showAcceptButton={isUnreviewed}
      onAccept={onAccept}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
