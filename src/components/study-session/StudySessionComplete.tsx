import { Empty, EmptyHeader, EmptyMedia, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import type { SessionStats } from "@/types";

interface StudySessionCompleteProps {
  stats: SessionStats;
}

export default function StudySessionComplete({ stats }: StudySessionCompleteProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Trophy />
        </EmptyMedia>
        <h1 className="text-lg font-medium tracking-tight">Session Complete! Congratulations!</h1>
        <EmptyDescription>
          You reviewed {stats.totalReviewed} {stats.totalReviewed === 1 ? "card" : "cards"} ({stats.knewCount} knew,{" "}
          {stats.forgotCount} forgot)
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <a href="/my-flashcards">Return to my flashcards</a>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
