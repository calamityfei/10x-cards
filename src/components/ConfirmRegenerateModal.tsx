import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmRegenerateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmRegenerateModal({ isOpen, onConfirm, onCancel }: ConfirmRegenerateModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Regenerate Flashcards?</DialogTitle>
          <DialogDescription>
            You have unsaved AI-generated flashcards. If you proceed, they will be discarded. Manually added cards will
            be preserved. Do you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Discard & Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
