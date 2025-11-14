import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmPartialSaveModalProps {
  isOpen: boolean;
  unreviewedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPartialSaveModal({
  isOpen,
  unreviewedCount,
  onConfirm,
  onCancel,
}: ConfirmPartialSaveModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Save Partially Reviewed Flashcards?</DialogTitle>
          <DialogDescription>
            You have {unreviewedCount} unreviewed flashcard{unreviewedCount !== 1 ? "s" : ""} that will be discarded if
            you proceed. Only manually reviewed cards will be saved. Do you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Discard & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
