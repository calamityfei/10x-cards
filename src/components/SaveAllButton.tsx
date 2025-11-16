import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Save } from "lucide-react";

interface SaveAllButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  count: number;
}

export function SaveAllButton({ onClick, disabled, isSaving, count }: SaveAllButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button onClick={onClick} disabled={disabled} size="lg" className="shadow-lg" data-testid="save-all-button">
        {isSaving ? (
          <>
            <Spinner />
            Saving...
          </>
        ) : (
          <>
            <Save />
            Save Cards ({count})
          </>
        )}
      </Button>
    </div>
  );
}
