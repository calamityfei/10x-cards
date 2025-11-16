import { useStudySession } from "@/hooks/useStudySession";
import StudySessionEmpty from "./study-session/StudySessionEmpty";
import StudySessionActive from "./study-session/StudySessionActive";
import StudySessionComplete from "./study-session/StudySessionComplete";
import StudySessionError from "./study-session/StudySessionError";
import { Loader2 } from "lucide-react";

export default function StudySession() {
  const { state, showAnswer, gradeCard, retry } = useStudySession();

  if (state.status === "loading") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <StudySessionError error={state.error} onRetry={retry} />
      </main>
    );
  }

  if (state.status === "empty") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <StudySessionEmpty />
      </main>
    );
  }

  if (state.status === "complete") {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <StudySessionComplete stats={state.stats} />
      </main>
    );
  }

  const currentCard = state.cards[state.currentIndex];
  if (!currentCard) return null;

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <StudySessionActive
        currentCard={currentCard}
        currentIndex={state.currentIndex}
        totalCards={state.cards.length}
        isAnswerRevealed={state.isAnswerRevealed}
        onShowAnswer={showAnswer}
        onGrade={gradeCard}
      />
    </main>
  );
}
