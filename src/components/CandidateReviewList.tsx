import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { FlashcardGrid } from "./FlashcardGrid";
import { AlertCircle, FileText } from "lucide-react";
import type { CandidateCardViewModel } from "@/hooks/useCreateFlashcards";
import { CandidateCard } from "./CandidateCard";

interface CandidateReviewListProps {
  candidates: CandidateCardViewModel[];
  isLoading: boolean;
  error: string | null;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CandidateReviewList({
  candidates,
  isLoading,
  error,
  onAccept,
  onEdit,
  onDelete,
}: CandidateReviewListProps) {
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleCandidates = candidates.filter((c) => c.status !== "deleted");

  if (visibleCandidates.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No flashcards yet</EmptyTitle>
          <EmptyDescription>Generate from text or add manually to get started.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <FlashcardGrid isLoading={isLoading}>
      {visibleCandidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onAccept={() => onAccept(candidate.id)}
          onEdit={() => onEdit(candidate.id)}
          onDelete={() => onDelete(candidate.id)}
        />
      ))}
    </FlashcardGrid>
  );
}
