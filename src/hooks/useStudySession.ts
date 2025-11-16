import { useState, useEffect, useCallback } from "react";
import { Rating, type RecordLog, type Grade } from "ts-fsrs";
import type { StudySessionState, GetDueFlashcardsResponseDto } from "@/types";
import { initializeFSRS, convertToFSRSCard, buildReviewCommand } from "@/lib/utils/fsrs";

interface UseStudySessionReturn {
  state: StudySessionState;
  showAnswer: () => void;
  gradeCard: (rating: Rating) => Promise<void>;
  retry: () => void;
}

export function useStudySession(): UseStudySessionReturn {
  const [state, setState] = useState<StudySessionState>({
    status: "loading",
    cards: [],
    currentIndex: 0,
    isAnswerRevealed: false,
    stats: {
      totalReviewed: 0,
      forgotCount: 0,
      knewCount: 0,
      startTime: new Date(),
      endTime: null,
    },
    error: null,
  });

  const fetchDueCards = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    try {
      const response = await fetch("/api/flashcards/due");
      if (!response.ok) throw new Error("Failed to fetch due cards");

      const result: GetDueFlashcardsResponseDto = await response.json();

      setState((prev) => ({
        ...prev,
        cards: result.data,
        status: result.data.length === 0 ? "empty" : "active",
        currentIndex: 0,
        isAnswerRevealed: false,
      }));
    } catch (error) {
      console.error("Error fetching due cards:", error);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to load flashcards. Please try again.",
      }));
    }
  }, []);

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

  useEffect(() => {
    const { status, currentIndex, cards } = state;
    if (status === "active" && currentIndex >= cards.length && cards.length > 0) {
      setState((prev) => ({
        ...prev,
        status: "complete",
        stats: { ...prev.stats, endTime: new Date() },
      }));
    }
  }, [state.currentIndex, state.cards.length, state.status]);

  const showAnswer = useCallback(() => {
    setState((prev) => ({ ...prev, isAnswerRevealed: true }));
  }, []);

  const gradeCard = useCallback(
    async (rating: Rating) => {
      const { cards, currentIndex, isAnswerRevealed } = state;
      if (!isAnswerRevealed || currentIndex >= cards.length) return;

      const currentCard = cards[currentIndex];
      const fsrs = initializeFSRS();
      const fsrsCard = convertToFSRSCard(currentCard);

      try {
        const now = new Date();
        const schedulingCards = fsrs.repeat(fsrsCard, now) as RecordLog;
        const recordLog = schedulingCards[rating as Grade];
        const reviewCommand = buildReviewCommand(recordLog, rating);

        setState((prev) => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          isAnswerRevealed: false,
          stats: {
            ...prev.stats,
            totalReviewed: prev.stats.totalReviewed + 1,
            forgotCount: rating === Rating.Again ? prev.stats.forgotCount + 1 : prev.stats.forgotCount,
            knewCount: rating === Rating.Good ? prev.stats.knewCount + 1 : prev.stats.knewCount,
          },
        }));

        fetch(`/api/flashcards/${currentCard.id}/review`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewCommand),
        }).catch((error) => console.error("Error updating card:", error));
      } catch (error) {
        console.error("Error grading card:", error);
      }
    },
    [state]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { status, isAnswerRevealed } = state;
      if (status !== "active") return;

      if (!isAnswerRevealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        showAnswer();
      } else if (isAnswerRevealed) {
        if (e.key === "1" || e.key.toLowerCase() === "f") {
          e.preventDefault();
          gradeCard(Rating.Again);
        } else if (e.key === "2" || e.key.toLowerCase() === "k") {
          e.preventDefault();
          gradeCard(Rating.Good);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, showAnswer, gradeCard]);

  return {
    state,
    showAnswer,
    gradeCard,
    retry: fetchDueCards,
  };
}
