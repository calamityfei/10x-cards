import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn("transition-opacity", isUnreviewed && "opacity-50")}>
      <CardContent className="space-y-4">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full rounded-md border bg-muted/30 p-6 text-left transition-all hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={isFlipped ? "Show front of card" : "Show back of card"}
        >
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">{isFlipped ? "Back" : "Front"}</div>
          <div className="text-sm">{isFlipped ? back : front}</div>
        </button>

        <div className="flex items-center gap-2">
          {showAcceptButton && onAccept && (
            <Button variant="outline" size="sm" onClick={onAccept}>
              <Check />
              Accept
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
