import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface FlashcardGridProps {
  isLoading: boolean;
  children: ReactNode;
}

export function FlashcardGrid({ isLoading, children }: FlashcardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {children}
    </div>
  );
}
