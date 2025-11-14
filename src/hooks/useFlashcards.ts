import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GetFlashcardsQueryDto, UpdateFlashcardCommand } from "@/types";
import { fetchFlashcards, updateFlashcard, deleteFlashcard } from "@/lib/api/flashcards";

export function useFlashcards(queryParams: GetFlashcardsQueryDto) {
  const queryClient = useQueryClient();

  const flashcardsQuery = useQuery({
    queryKey: ["flashcards", queryParams],
    queryFn: () => fetchFlashcards(queryParams),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFlashcardCommand }) => updateFlashcard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFlashcard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  return {
    flashcards: flashcardsQuery.data?.data ?? [],
    pagination: flashcardsQuery.data?.pagination,
    isLoading: flashcardsQuery.isLoading,
    isError: flashcardsQuery.isError,
    error: flashcardsQuery.error,
    updateFlashcard: updateMutation.mutate,
    deleteFlashcard: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
