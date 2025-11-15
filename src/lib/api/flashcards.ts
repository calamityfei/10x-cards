import type {
  GenerateCandidatesResponseDto,
  CreateGenerationCommand,
  CreateGenerationResponseDto,
  CreateFlashcardsCommand,
  CreateFlashcardsResponseDto,
} from "@/types";

export async function generateCandidates(sourceText: string): Promise<GenerateCandidatesResponseDto> {
  const response = await fetch("/api/generations/generate-candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_text: sourceText }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ details: "Generation failed" }));
    const message = error?.details || error?.error || "Generation failed";
    throw new Error(message);
  }

  return response.json();
}

export async function saveGenerationLog(command: CreateGenerationCommand): Promise<CreateGenerationResponseDto> {
  const response = await fetch("/api/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error("Failed to save generation log");
  }

  return response.json();
}

export async function saveFlashcards(command: CreateFlashcardsCommand): Promise<CreateFlashcardsResponseDto> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error("Failed to save flashcards");
  }

  return response.json();
}

export async function fetchFlashcards(
  params: import("@/types").GetFlashcardsQueryDto
): Promise<import("@/types").GetFlashcardsResponseDto> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  const response = await fetch(`/api/flashcards?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch flashcards" }));
    throw new Error(error.message || "Failed to fetch flashcards");
  }

  return response.json();
}

export async function updateFlashcard(
  id: number,
  data: import("@/types").UpdateFlashcardCommand
): Promise<import("@/types").FlashcardDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update flashcard" }));
    throw new Error(error.message || "Failed to update flashcard");
  }

  return response.json();
}

export async function deleteFlashcard(id: number): Promise<void> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete flashcard" }));
    throw new Error(error.message || "Failed to delete flashcard");
  }
}
