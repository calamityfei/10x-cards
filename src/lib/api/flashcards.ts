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
    const error = await response.json();
    throw new Error(error.details || "Generation failed");
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
