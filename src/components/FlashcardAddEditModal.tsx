import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlashcardFormData } from "@/hooks/useCreateFlashcards";

interface FlashcardAddEditModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: FlashcardFormData;
  onSave: (data: FlashcardFormData) => void;
  onCancel: () => void;
}

export function FlashcardAddEditModal({ isOpen, mode, initialData, onSave, onCancel }: FlashcardAddEditModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFront(initialData?.front || "");
      setBack(initialData?.back || "");
    }
  }, [isOpen, initialData]);

  const frontValid = front.length > 0 && front.length <= 200;
  const backValid = back.length > 0 && back.length <= 500;
  const canSave = frontValid && backValid;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ front, back });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Flashcard" : "Edit Flashcard"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="front" className="text-sm font-medium">
              Front
            </label>
            <input
              id="front"
              type="text"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Enter front text..."
              maxLength={200}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                front.length > 200 && "border-destructive"
              )}
            />
            <div
              className={cn("text-right text-xs", front.length > 200 ? "text-destructive" : "text-muted-foreground")}
            >
              {front.length} / 200
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="back" className="text-sm font-medium">
              Back
            </label>
            <textarea
              id="back"
              rows={4}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Enter back text..."
              maxLength={500}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                back.length > 500 && "border-destructive"
              )}
            />
            <div className={cn("text-right text-xs", back.length > 500 ? "text-destructive" : "text-muted-foreground")}>
              {back.length} / 500
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
