import { FSRS, createEmptyCard, Rating, type RecordLogItem, State, type Card } from "ts-fsrs";
import type { FlashcardWithSrsDto, ReviewFlashcardCommand } from "@/types";

/**
 * Initializes and returns an FSRS scheduler instance.
 */
export function initializeFSRS(): FSRS {
  return new FSRS({});
}

/**
 * Converts a FlashcardWithSrsDto to an FSRS Card instance.
 * If the card has no SRS data, returns a new card with default values.
 */
export function convertToFSRSCard(flashcard: FlashcardWithSrsDto): Card {
  if (!flashcard.srs_state || !flashcard.srs_due) {
    return createEmptyCard(new Date());
  }

  return {
    due: new Date(flashcard.srs_due),
    stability: flashcard.srs_stability ?? 0,
    difficulty: flashcard.srs_difficulty ?? 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: flashcard.srs_reps ?? 0,
    lapses: flashcard.srs_lapses ?? 0,
    state: mapStateToFSRS(flashcard.srs_state),
    last_review: flashcard.last_reviewed ? new Date(flashcard.last_reviewed) : undefined,
  };
}

/**
 * Maps database SRS state string to FSRS State enum.
 */
function mapStateToFSRS(state: string): State {
  switch (state) {
    case "New":
      return State.New;
    case "Learning":
      return State.Learning;
    case "Review":
      return State.Review;
    case "Relearning":
      return State.Relearning;
    default:
      return State.New;
  }
}

/**
 * Maps FSRS State enum to database SRS state string.
 */
function mapStateFromFSRS(state: State): string {
  switch (state) {
    case State.New:
      return "New";
    case State.Learning:
      return "Learning";
    case State.Review:
      return "Review";
    case State.Relearning:
      return "Relearning";
    default:
      return "New";
  }
}

/**
 * Builds a ReviewFlashcardCommand from FSRS RecordLogItem and rating.
 */
export function buildReviewCommand(recordLogItem: RecordLogItem, rating: Rating): ReviewFlashcardCommand {
  const { card } = recordLogItem;

  return {
    rating,
    srs_state: mapStateFromFSRS(card.state),
    srs_due: card.due.toISOString(),
    srs_stability: card.stability,
    srs_difficulty: card.difficulty,
    srs_elapsed_days: card.elapsed_days,
    srs_scheduled_days: card.scheduled_days,
    srs_reps: card.reps,
    srs_lapses: card.lapses,
  };
}
