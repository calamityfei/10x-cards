import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SearchInput } from "./SearchInput";
import { FlashcardGrid } from "./FlashcardGrid";
import { FlashCard } from "./FlashCard";
import { Pagination } from "./Pagination";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlashcardAddEditModal } from "./FlashcardAddEditModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { useFlashcards } from "@/hooks/useFlashcards";
import { FileText } from "lucide-react";
import type { FlashcardDto, ModalState, UpdateFlashcardCommand } from "@/types";

const queryClient = new QueryClient();

function MyFlashcardsContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"created_at" | "updated_at" | "front" | "back">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [modalState, setModalState] = useState<ModalState>({
    editModal: { isOpen: false, flashcard: null },
    deleteModal: { isOpen: false, flashcard: null },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    const search = params.get("search");
    if (page) setCurrentPage(parseInt(page));
    if (search) setSearchQuery(search);
  }, []);

  const { flashcards, pagination, isLoading, isError, error, updateFlashcard, deleteFlashcard } = useFlashcards({
    page: currentPage,
    limit: 50,
    search: searchQuery || undefined,
    sort: sortBy,
    order: sortOrder,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(error instanceof Error ? error.message : "Failed to load flashcards");
    }
  }, [isError, error]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.pushState({}, "", newURL);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split("-") as ["created_at" | "updated_at" | "front" | "back", "asc" | "desc"];
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const sortValue = `${sortBy}-${sortOrder}`;

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSearchQuery((currentSearch) => {
      const params = new URLSearchParams();
      if (page > 1) params.set("page", page.toString());
      if (currentSearch) params.set("search", currentSearch);
      const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      window.history.pushState({}, "", newURL);
      return currentSearch;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleEdit = (flashcard: FlashcardDto) => {
    setModalState({
      ...modalState,
      editModal: { isOpen: true, flashcard },
    });
  };

  const handleDelete = (flashcard: FlashcardDto) => {
    setModalState({
      ...modalState,
      deleteModal: { isOpen: true, flashcard },
    });
  };

  const handleEditSave = async (data: UpdateFlashcardCommand) => {
    if (!modalState.editModal.flashcard) return;

    updateFlashcard(
      { id: modalState.editModal.flashcard.id, data },
      {
        onSuccess: () => {
          setModalState({
            ...modalState,
            editModal: { isOpen: false, flashcard: null },
          });
          toast.success("Flashcard updated successfully");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to update flashcard");
        },
      }
    );
  };

  const handleEditCancel = () => {
    setModalState({
      ...modalState,
      editModal: { isOpen: false, flashcard: null },
    });
  };

  const handleDeleteConfirm = () => {
    if (!modalState.deleteModal.flashcard) return;

    deleteFlashcard(modalState.deleteModal.flashcard.id, {
      onSuccess: () => {
        setModalState({
          ...modalState,
          deleteModal: { isOpen: false, flashcard: null },
        });
        toast.success("Flashcard deleted successfully");

        if (flashcards.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        }
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to delete flashcard");
      },
    });
  };

  const handleDeleteCancel = () => {
    setModalState({
      ...modalState,
      deleteModal: { isOpen: false, flashcard: null },
    });
  };

  const showEmptyState = !isLoading && !isError && flashcards.length === 0 && !searchQuery;
  const showNoResults = !isLoading && !isError && flashcards.length === 0 && searchQuery;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col p-6">
      <h1 className="mb-6 text-3xl font-bold">My Flashcards</h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={searchQuery} onChange={handleSearchChange} placeholder="Search flashcards..." />
        </div>
        <Select value={sortValue} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest first</SelectItem>
            <SelectItem value="created_at-asc">Oldest first</SelectItem>
            <SelectItem value="updated_at-desc">Recently updated</SelectItem>
            <SelectItem value="updated_at-asc">Longest stalled</SelectItem>
            <SelectItem value="front-asc">Front (A-Z)</SelectItem>
            <SelectItem value="front-desc">Front (Z-A)</SelectItem>
            <SelectItem value="back-asc">Back (A-Z)</SelectItem>
            <SelectItem value="back-desc">Back (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Failed to load flashcards</EmptyTitle>
            <EmptyDescription>Please try refreshing the page.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {showEmptyState && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Your deck is empty!</EmptyTitle>
            <EmptyDescription>Start creating flashcards to build your learning deck.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <a href="/create-flashcards">Create Flashcards</a>
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {showNoResults && (
        <div className="py-12 text-center">
          <p className="mb-2 text-lg font-medium">No flashcards match your search.</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term or{" "}
            <button onClick={() => handleSearchChange("")} className="text-primary underline">
              clear search
            </button>
            .
          </p>
        </div>
      )}

      {!showEmptyState && !showNoResults && (
        <>
          <FlashcardGrid isLoading={isLoading}>
            {flashcards.map((flashcard) => (
              <FlashCard
                key={flashcard.id}
                front={flashcard.front}
                back={flashcard.back}
                hideAcceptButton
                onEdit={() => handleEdit(flashcard)}
                onDelete={() => handleDelete(flashcard)}
              />
            ))}
          </FlashcardGrid>

          {pagination && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <FlashcardAddEditModal
        isOpen={modalState.editModal.isOpen}
        mode="edit"
        initialData={
          modalState.editModal.flashcard
            ? { front: modalState.editModal.flashcard.front, back: modalState.editModal.flashcard.back }
            : undefined
        }
        onSave={handleEditSave}
        onCancel={handleEditCancel}
      />

      <ConfirmationModal
        isOpen={modalState.deleteModal.isOpen}
        title="Delete Flashcard"
        description="Are you sure you want to delete this flashcard? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}

export default function MyFlashcardsView() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyFlashcardsContent />
      <Toaster />
    </QueryClientProvider>
  );
}
