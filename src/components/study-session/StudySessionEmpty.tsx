import { Empty, EmptyHeader, EmptyMedia, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function StudySessionEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookOpen />
        </EmptyMedia>
        <h1 className="text-lg font-medium tracking-tight">You don&apos;t have any flashcards to study</h1>
        <EmptyDescription>Create your first flashcards to start learning with spaced repetition.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <a href="/create-flashcards">Create Flashcards</a>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
