import { Empty, EmptyHeader, EmptyMedia, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function StudySessionComingSoon() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Calendar />
          </EmptyMedia>
          <h1 className="text-lg font-medium tracking-tight">Study Sessions Coming Soon</h1>
          <EmptyDescription>
            We&apos;re working hard to bring you the best-in-class review experience! In the meantime, you can create
            and manage your flashcards.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <a href="/create-flashcards">Create Flashcards</a>
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
