import { Empty, EmptyHeader, EmptyMedia, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface StudySessionErrorProps {
  error: string | null;
  onRetry: () => void;
}

export default function StudySessionError({ error, onRetry }: StudySessionErrorProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle />
        </EmptyMedia>
        <h1 className="text-lg font-medium tracking-tight">Something went wrong</h1>
        <EmptyDescription>{error || "Failed to load flashcards. Please try again."}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry}>Retry</Button>
      </EmptyContent>
    </Empty>
  );
}
