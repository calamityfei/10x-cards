import { FlashCard } from "./FlashCard";
import { Check } from "lucide-react";
import type { CandidateCardViewModel } from "@/hooks/useCreateFlashcards";

interface CandidateCardProps {
  candidate: CandidateCardViewModel;
  onAccept: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CandidateCard({ candidate, onAccept, onEdit, onDelete }: CandidateCardProps) {
  const isUnreviewed = candidate.status === "unreviewed";
  const isApproved = candidate.status === "accepted" || candidate.status === "edited";

  return (
    <div className="relative">
      <FlashCard
        front={candidate.front}
        back={candidate.back}
        isUnreviewed={isUnreviewed}
        showAcceptButton={isUnreviewed}
        onAccept={onAccept}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {isApproved && (
        <div className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="size-4" />
        </div>
      )}
    </div>
  );
}
