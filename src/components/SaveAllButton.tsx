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
    <Button onClick={onClick} disabled={disabled} size="lg">
      {isSaving ? (
        <>
          <Spinner />
          Saving...
        </>
      ) : (
        <>
          <Save />
          Save All Cards ({count})
        </>
      )}
    </Button>
  );
}
