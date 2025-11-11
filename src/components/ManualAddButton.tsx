import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ManualAddButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function ManualAddButton({ onClick, disabled }: ManualAddButtonProps) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled}>
      <Plus />
      Add Manually
    </Button>
  );
}
