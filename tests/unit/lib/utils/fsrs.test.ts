import { describe, it, expect } from "vitest";
import { State, Rating, type RecordLogItem } from "ts-fsrs";
import { initializeFSRS, convertToFSRSCard, buildReviewCommand } from "@/lib/utils/fsrs";
import type { FlashcardWithSrsDto } from "@/types";

describe("fsrs", () => {
  describe("initializeFSRS", () => {
    it("should return an FSRS instance", () => {
      const fsrs = initializeFSRS();
      expect(fsrs).toBeDefined();
      expect(typeof fsrs.repeat).toBe("function");
    });
  });

  describe("convertToFSRSCard", () => {
    it("should convert flashcard with complete SRS data", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "Review",
        srs_due: "2024-01-15T00:00:00Z",
        srs_stability: 10.5,
        srs_difficulty: 5.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 3,
        srs_lapses: 1,
        last_reviewed: "2024-01-10T00:00:00Z",
      };

      const card = convertToFSRSCard(flashcard);

      expect(card.state).toBe(State.Review);
      expect(card.due).toEqual(new Date("2024-01-15T00:00:00Z"));
      expect(card.stability).toBe(10.5);
      expect(card.difficulty).toBe(5.2);
      expect(card.reps).toBe(3);
      expect(card.lapses).toBe(1);
      expect(card.last_review).toEqual(new Date("2024-01-10T00:00:00Z"));
    });

    it("should create empty card when srs_state is null", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: null,
        srs_due: null,
        srs_stability: null,
        srs_difficulty: null,
        srs_elapsed_days: null,
        srs_scheduled_days: null,
        srs_reps: null,
        srs_lapses: null,
        last_reviewed: null,
      };

      const card = convertToFSRSCard(flashcard);

      expect(card.state).toBe(State.New);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
    });

    it("should create empty card when srs_due is null", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Question",
        back: "Answer",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "New",
        srs_due: null,
        srs_stability: null,
        srs_difficulty: null,
        srs_elapsed_days: null,
        srs_scheduled_days: null,
        srs_reps: null,
        srs_lapses: null,
        last_reviewed: null,
      };

      const card = convertToFSRSCard(flashcard);

      expect(card.state).toBe(State.New);
    });

    it("should map New state correctly", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      };

      const card = convertToFSRSCard(flashcard);
      expect(card.state).toBe(State.New);
    });

    it("should map Learning state correctly", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "Learning",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 1,
        srs_difficulty: 5,
        srs_elapsed_days: 0,
        srs_scheduled_days: 1,
        srs_reps: 1,
        srs_lapses: 0,
        last_reviewed: "2024-01-01T00:00:00Z",
      };

      const card = convertToFSRSCard(flashcard);
      expect(card.state).toBe(State.Learning);
    });

    it("should map Relearning state correctly", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "Relearning",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 2,
        srs_difficulty: 7,
        srs_elapsed_days: 1,
        srs_scheduled_days: 2,
        srs_reps: 2,
        srs_lapses: 1,
        last_reviewed: "2024-01-01T00:00:00Z",
      };

      const card = convertToFSRSCard(flashcard);
      expect(card.state).toBe(State.Relearning);
    });

    it("should handle missing last_reviewed", () => {
      const flashcard: FlashcardWithSrsDto = {
        id: 1,
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        srs_state: "New",
        srs_due: "2024-01-01T00:00:00Z",
        srs_stability: 0,
        srs_difficulty: 0,
        srs_elapsed_days: 0,
        srs_scheduled_days: 0,
        srs_reps: 0,
        srs_lapses: 0,
        last_reviewed: null,
      };

      const card = convertToFSRSCard(flashcard);
      expect(card.last_review).toBeUndefined();
    });
  });

  describe("buildReviewCommand", () => {
    it("should build review command with Rating.Again", () => {
      const mockRecordLogItem = {
        card: {
          due: new Date("2024-01-20T00:00:00Z"),
          stability: 5.5,
          difficulty: 6.2,
          elapsed_days: 5,
          scheduled_days: 10,
          reps: 4,
          lapses: 2,
          state: State.Relearning,
          learning_steps: 0,
        },
      };

      const command = buildReviewCommand(mockRecordLogItem as RecordLogItem, Rating.Again);

      expect(command).toEqual({
        rating: Rating.Again,
        srs_state: "Relearning",
        srs_due: "2024-01-20T00:00:00.000Z",
        srs_stability: 5.5,
        srs_difficulty: 6.2,
        srs_elapsed_days: 5,
        srs_scheduled_days: 10,
        srs_reps: 4,
        srs_lapses: 2,
      });
    });

    it("should build review command with Rating.Good", () => {
      const mockRecordLogItem = {
        card: {
          due: new Date("2024-02-01T00:00:00Z"),
          stability: 15.0,
          difficulty: 4.5,
          elapsed_days: 10,
          scheduled_days: 20,
          reps: 5,
          lapses: 0,
          state: State.Review,
          learning_steps: 0,
        },
      };

      const command = buildReviewCommand(mockRecordLogItem as RecordLogItem, Rating.Good);

      expect(command).toEqual({
        rating: Rating.Good,
        srs_state: "Review",
        srs_due: "2024-02-01T00:00:00.000Z",
        srs_stability: 15.0,
        srs_difficulty: 4.5,
        srs_elapsed_days: 10,
        srs_scheduled_days: 20,
        srs_reps: 5,
        srs_lapses: 0,
      });
    });

    it("should map State.New to 'New'", () => {
      const mockRecordLogItem = {
        card: {
          due: new Date("2024-01-01T00:00:00Z"),
          stability: 0,
          difficulty: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          reps: 0,
          lapses: 0,
          state: State.New,
          learning_steps: 0,
        },
      };

      const command = buildReviewCommand(mockRecordLogItem as RecordLogItem, Rating.Good);
      expect(command.srs_state).toBe("New");
    });

    it("should map State.Learning to 'Learning'", () => {
      const mockRecordLogItem = {
        card: {
          due: new Date("2024-01-01T00:00:00Z"),
          stability: 1,
          difficulty: 5,
          elapsed_days: 0,
          scheduled_days: 1,
          reps: 1,
          lapses: 0,
          state: State.Learning,
          learning_steps: 0,
        },
      };

      const command = buildReviewCommand(mockRecordLogItem as RecordLogItem, Rating.Good);
      expect(command.srs_state).toBe("Learning");
    });
  });
});
