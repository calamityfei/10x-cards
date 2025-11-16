import { Button } from "@/components/ui/button";
import { Rating } from "ts-fsrs";

interface GradingButtonsProps {
  onGrade: (rating: Rating) => void;
  disabled?: boolean;
}

export default function GradingButtons({ onGrade, disabled }: GradingButtonsProps) {
  return (
    <div className="flex gap-4 justify-center">
      <Button
        variant="outline"
        size="lg"
        onClick={() => onGrade(Rating.Again)}
        disabled={disabled}
        className="flex flex-col gap-1 h-auto py-3 min-w-[120px]"
        data-testid="grade-forgot-button"
      >
        <span>Forgot</span>
        <span className="text-xs">(1 or F)</span>
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={() => onGrade(Rating.Good)}
        disabled={disabled}
        className="flex flex-col gap-1 h-auto py-3 min-w-[120px]"
        data-testid="grade-knew-button"
      >
        <span>Knew</span>
        <span className="text-xs">(2 or K)</span>
      </Button>
    </div>
  );
}
