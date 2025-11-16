import { Button } from "@/components/ui/button";
import { Rating } from "ts-fsrs";
import type { FlashcardWithSrsDto } from "@/types";
import { FlashCard } from "@/components/FlashCard";
import GradingButtons from "./GradingButtons";

interface StudySessionActiveProps {
  currentCard: FlashcardWithSrsDto;
  currentIndex: number;
  totalCards: number;
  isAnswerRevealed: boolean;
  onShowAnswer: () => void;
  onGrade: (rating: Rating) => void;
}

export default function StudySessionActive({
  currentCard,
  currentIndex,
  totalCards,
  isAnswerRevealed,
  onShowAnswer,
  onGrade,
}: StudySessionActiveProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <div className="text-sm text-muted-foreground" aria-live="polite">
        Card {currentIndex + 1} of {totalCards}
      </div>

      <div className="w-full min-w-[320px] max-w-[320px]">
        <FlashCard
          front={currentCard.front}
          back={currentCard.back}
          showAnswerButton={true}
          isFlipped={isAnswerRevealed}
        />
      </div>

      <div className="w-full flex justify-center">
        {!isAnswerRevealed ? (
          <Button size="lg" onClick={onShowAnswer} className="flex flex-col gap-1 h-auto py-3">
            <span>Show Answer</span>
            <span className="text-xs">(Space or Enter)</span>
          </Button>
        ) : (
          <GradingButtons onGrade={onGrade} />
        )}
      </div>
    </div>
  );
}
