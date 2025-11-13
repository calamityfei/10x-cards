import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
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
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
      <Card>
        <CardContent className="text-center text-muted-foreground">
          <p>No flashcards yet. Generate from text or add manually.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visibleCandidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onAccept={() => onAccept(candidate.id)}
          onEdit={() => onEdit(candidate.id)}
          onDelete={() => onDelete(candidate.id)}
        />
      ))}
    </div>
  );
}
