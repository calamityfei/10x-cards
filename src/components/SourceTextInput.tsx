import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function SourceTextInput({ value, onChange, onGenerate, isGenerating, disabled }: SourceTextInputProps) {
  const charCount = value.length;
  const isValid = charCount >= 1000 && charCount <= 10000;
  const showError = charCount > 0 && !isValid;

  let errorMessage = "";
  if (charCount > 0 && charCount < 1000) {
    errorMessage = "Text must be at least 1,000 characters";
  } else if (charCount > 10000) {
    errorMessage = "Text must not exceed 10,000 characters";
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="source-text" className="text-sm font-medium">
            Source Text
          </label>
          <textarea
            id="source-text"
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Paste your study notes here (1,000-10,000 characters)..."
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
              showError && "border-destructive"
            )}
            aria-invalid={showError}
            aria-describedby={showError ? "source-text-error" : "source-text-counter"}
          />
          <div className="flex items-center justify-between">
            <div
              id={showError ? "source-text-error" : "source-text-counter"}
              className={cn("text-sm", showError ? "text-destructive" : "text-muted-foreground")}
            >
              {showError ? errorMessage : `${charCount} / 10,000 characters`}
            </div>
            <Button onClick={onGenerate} disabled={!isValid || disabled} size="sm">
              {isGenerating ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
