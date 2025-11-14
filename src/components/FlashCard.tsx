import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  front: string;
  back: string;
  isUnreviewed?: boolean;
  showAcceptButton?: boolean;
  hideAcceptButton?: boolean;
  onAccept?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FlashCard({
  front,
  back,
  isUnreviewed = false,
  showAcceptButton = false,
  hideAcceptButton = false,
  onAccept,
  onEdit,
  onDelete,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const frontRef = useRef<HTMLParagraphElement>(null);
  const backRef = useRef<HTMLParagraphElement>(null);
  const [frontFontSize, setFrontFontSize] = useState(16);
  const [backFontSize, setBackFontSize] = useState(14);

  useEffect(() => {
    const calculateFontSize = (element: HTMLParagraphElement | null, baseFontSize: number) => {
      if (!element) return baseFontSize;
      const container = element.parentElement;
      if (!container) return baseFontSize;

      // Reset to base size first
      element.style.fontSize = `${baseFontSize}px`;

      // Get computed padding from the container
      const computedStyle = window.getComputedStyle(container);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);
      const verticalPadding = paddingTop + paddingBottom;

      const availableHeight = container.clientHeight - verticalPadding;
      const contentHeight = element.scrollHeight;

      if (contentHeight > availableHeight) {
        const ratio = availableHeight / contentHeight;
        return Math.max(baseFontSize * ratio, 10);
      }
      return baseFontSize;
    };

    setFrontFontSize(calculateFontSize(frontRef.current, 20));
    setBackFontSize(calculateFontSize(backRef.current, 14));
  }, [front, back]);

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
            "absolute inset-0 flex items-center justify-center rounded-lg border-2 px-6 py-10 text-center shadow-md transition-opacity hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isUnreviewed
              ? "border-muted bg-muted text-muted-foreground"
              : "border-secondary bg-secondary text-secondary-foreground",
            isFlipped && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden" }}
          aria-label="Show back of card"
        >
          <p
            ref={frontRef}
            className="break-words"
            style={{
              wordBreak: "break-word",
              fontSize: `${frontFontSize}px`,
            }}
          >
            {front}
          </p>
        </button>

        {/* Back */}
        <button
          onClick={() => setIsFlipped(false)}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-lg border-2 px-6 py-10 text-center shadow-md transition-opacity hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isUnreviewed
              ? "border-muted bg-muted text-muted-foreground"
              : "border-secondary bg-secondary/80 text-secondary-foreground",
            !isFlipped && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-label="Show front of card"
        >
          <p
            ref={backRef}
            className="break-words"
            style={{
              wordBreak: "break-word",
              fontSize: `${backFontSize}px`,
            }}
          >
            {back}
          </p>
        </button>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-2 left-2 z-10 flex gap-1">
        {!hideAcceptButton && (
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
        )}
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
