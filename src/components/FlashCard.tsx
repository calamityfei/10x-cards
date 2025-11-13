import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  front: string;
  back: string;
  isUnreviewed?: boolean;
  showAcceptButton?: boolean;
  onAccept?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashCard({
  front,
  back,
  isUnreviewed = false,
  showAcceptButton = false,
  onAccept,
  onEdit,
  onDelete,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative h-64 w-full" style={{ perspective: "1000px" }}>
      <div
        className={cn(
          "relative h-full w-full transition-transform duration-500",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <button
          onClick={() => setIsFlipped(true)}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg border-2 p-6 text-center shadow-md transition-opacity hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isUnreviewed
              ? "border-muted bg-muted text-muted-foreground"
              : "border-secondary bg-secondary text-secondary-foreground",
            isFlipped && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden" }}
          aria-label="Show back of card"
        >
          <p className="text-base font-semibold sm:text-lg">{front}</p>
        </button>

        {/* Back */}
        <button
          onClick={() => setIsFlipped(false)}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg border-2 p-6 text-center shadow-md transition-opacity hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isUnreviewed
              ? "border-muted bg-muted text-muted-foreground"
              : "border-secondary bg-secondary/80 text-secondary-foreground",
            !isFlipped && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-label="Show front of card"
        >
          <p className="text-sm sm:text-base">{back}</p>
        </button>
      </div>

      {/* Action buttons */}
      <div className="absolute left-2 top-2 z-10 flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "size-9 rounded-full shadow-sm",
            !showAcceptButton && "bg-green-500 text-white hover:bg-green-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (showAcceptButton && onAccept) onAccept();
          }}
          disabled={!showAcceptButton}
          aria-label={showAcceptButton ? "Accept card" : "Card accepted"}
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit card"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete card"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
