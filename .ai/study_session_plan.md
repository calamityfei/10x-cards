# Study Session Implementation Plan

## 1. Overview

This plan outlines the implementation of the Study Session feature for 10xCards, replacing the current placeholder page. The implementation uses the **ts-fsrs** library (Free Spaced Repetition Scheduler) to provide a scientifically-backed spaced repetition algorithm. The feature allows users to review flashcards that are due, grade themselves with "Forgot" and "Knew" buttons, and track their learning progress over time.

### Key User Stories Addressed

- **US-017**: Start Study Session
- **US-018**: Study a Card
- **US-019**: Complete Study Session
- **US-021**: Empty "Study Session" (No Cards)
- **US-022**: Empty "Study Session" (No Cards Due)

### Library Selection: ts-fsrs

**Rationale:**

- **Modern & TypeScript-native**: Written in TypeScript with full type support
- **Scientifically-backed**: Implements FSRS algorithm, more advanced than classic SM-2
- **Actively maintained**: Version 5.2.3 (updated September 2024)
- **Simple API**: Easy integration with "Forgot"/"Knew" button pattern
- **MIT License**: Open-source and permissive
- **No backend required**: All calculations happen client-side

**Package**: `ts-fsrs` (npm)
**Documentation**: https://github.com/open-spaced-repetition/ts-fsrs

---

## 2. Database Schema Changes

### 2.1. Extend `public.flashcards` Table

Add new columns to support spaced repetition metadata:

```sql
ALTER TABLE public.flashcards
ADD COLUMN srs_state TEXT DEFAULT 'New',
ADD COLUMN srs_due TIMESTAMPTZ DEFAULT now(),
ADD COLUMN srs_stability REAL,
ADD COLUMN srs_difficulty REAL,
ADD COLUMN srs_elapsed_days INTEGER DEFAULT 0,
ADD COLUMN srs_scheduled_days INTEGER DEFAULT 0,
ADD COLUMN srs_reps INTEGER DEFAULT 0,
ADD COLUMN srs_lapses INTEGER DEFAULT 0,
ADD COLUMN last_reviewed TIMESTAMPTZ;
```

**Column Descriptions:**

- `srs_state`: Card state - 'New', 'Learning', 'Review', or 'Relearning'
- `srs_due`: Next review date/time (used to determine if card is due)
- `srs_stability`: FSRS stability parameter (memory strength)
- `srs_difficulty`: FSRS difficulty parameter (card difficulty)
- `srs_elapsed_days`: Days since last review
- `srs_scheduled_days`: Days scheduled for next review
- `srs_reps`: Number of successful reviews
- `srs_lapses`: Number of times card was forgotten
- `last_reviewed`: Timestamp of last review

### 2.2. Create Index for Due Cards Query

```sql
CREATE INDEX idx_flashcards_due
ON public.flashcards (user_id, srs_due)
WHERE srs_due <= now();
```

This index optimizes the query for fetching due cards for a user.

---

## 3. API Endpoints

### 3.1. GET /flashcards/due

**Description**: Retrieves all flashcards that are currently due for review for the authenticated user.

**Query Parameters**: None

**Response Payload (200 OK)**:

```json
{
  "data": [
    {
      "id": 1,
      "front": "What is SQL?",
      "back": "A query language for relational databases.",
      "srs_state": "Review",
      "srs_due": "2025-01-15T10:00:00Z",
      "srs_stability": 5.2,
      "srs_difficulty": 6.1,
      "srs_reps": 3,
      "srs_lapses": 1
    }
  ],
  "count": 15
}
```

**Error Codes**:

- `401 Unauthorized`: No valid JWT provided

**Implementation Notes**:

- Query: `WHERE user_id = $1 AND srs_due <= now() ORDER BY srs_due ASC`
- Returns all due cards (no pagination for study session)

### 3.2. PATCH /flashcards/:id/review

**Description**: Updates a flashcard's SRS metadata after a review (US-018).

**Request Payload**:

```json
{
  "rating": 1,
  "srs_state": "Review",
  "srs_due": "2025-01-20T10:00:00Z",
  "srs_stability": 7.8,
  "srs_difficulty": 5.9,
  "srs_elapsed_days": 5,
  "srs_scheduled_days": 5,
  "srs_reps": 4,
  "srs_lapses": 1
}
```

**Response Payload (200 OK)**:

```json
{
  "id": 1,
  "front": "What is SQL?",
  "back": "A query language for relational databases.",
  "srs_state": "Review",
  "srs_due": "2025-01-20T10:00:00Z",
  "last_reviewed": "2025-01-15T10:05:00Z"
}
```

**Error Codes**:

- `400 Bad Request`: Invalid rating or SRS data
- `401 Unauthorized`: No valid JWT provided
- `404 Not Found`: Flashcard not found or doesn't belong to user

**Implementation Notes**:

- `rating`: 1 = "Forgot", 3 = "Knew" (FSRS rating scale)
- All SRS fields are calculated client-side by ts-fsrs library
- `last_reviewed` is set to `now()` on the server

### 3.3. GET /flashcards/stats

**Description**: Retrieves study statistics for the authenticated user (optional, for future enhancements).

**Response Payload (200 OK)**:

```json
{
  "total_cards": 150,
  "due_today": 15,
  "new_cards": 20,
  "learning_cards": 10,
  "review_cards": 120
}
```

---

## 4. Frontend Implementation

### 4.1. Install Dependencies

```bash
npm install ts-fsrs
```

### 4.2. Create SRS Service

**File**: `/src/lib/services/srs.service.ts`

**Purpose**: Encapsulates all FSRS logic and provides a clean API for the UI.

**Key Functions**:

- `initializeFSRS()`: Creates FSRS instance with default parameters
- `scheduleCard(card, rating)`: Calculates next review date based on rating
- `getDueCards(allCards)`: Filters cards that are due for review
- `mapToFSRSCard(dbCard)`: Converts database card to FSRS card format
- `mapFromFSRSCard(fsrsCard)`: Converts FSRS card back to database format

**Example Implementation**:

```typescript
import { FSRS, Rating, Card, State } from "ts-fsrs";

const fsrs = new FSRS();

export function scheduleCard(card: Card, rating: Rating) {
  const schedulingCards = fsrs.repeat(card, new Date());
  return schedulingCards[rating];
}

export function getDueCards(cards: Card[]): Card[] {
  const now = new Date();
  return cards.filter((card) => card.due <= now);
}
```

### 4.3. Update Study Session Page

**File**: `/src/pages/study-session.astro`

**Changes**:

- Remove placeholder "Coming Soon" message
- Add React island for interactive study session
- Fetch due cards on page load
- Handle empty states (US-021, US-022)

### 4.4. Create Study Session Component

**File**: `/src/components/StudySession.tsx`

**Component Structure**:

```
StudySession (React)
├── StudySessionEmpty (no cards - US-021)
├── StudySessionCaughtUp (no due cards - US-022)
├── StudySessionActive
│   ├── FlashCard (shows front/back)
│   ├── ShowAnswerButton
│   └── GradingButtons (Forgot/Knew)
└── StudySessionComplete (US-019)
```

**State Management**:

- `dueCards`: Array of cards due for review
- `currentCardIndex`: Index of current card being reviewed
- `showBack`: Boolean for flip state
- `sessionComplete`: Boolean for completion state
- `isLoading`: Boolean for API calls

**Key Interactions**:

1. User clicks "Show Answer" → Flip card to show back
2. User clicks "Forgot" (Rating.Again = 1) → Schedule card, move to next
3. User clicks "Knew" (Rating.Good = 3) → Schedule card, move to next
4. Last card graded → Show completion message

### 4.5. Create Grading Buttons Component

**File**: `/src/components/GradingButtons.tsx`

**Props**:

- `onGrade: (rating: Rating) => void`
- `disabled: boolean`

**UI**:

- Two buttons: "Forgot" (destructive variant) and "Knew" (success variant)
- Only visible after "Show Answer" is clicked
- Disabled during API call

### 4.6. Update FlashCard Component

**File**: `/src/components/FlashCard.tsx`

**Changes**:

- Add `showAnswerButton` prop (boolean)
- Add `onShowAnswer` callback prop
- Disable click-to-flip when `showAnswerButton` is true
- Show "Show Answer" button below card in study mode

---

## 5. Data Flow

### 5.1. Starting a Study Session (US-017)

1. User navigates to `/study-session`
2. Page component calls `GET /flashcards/due`
3. If `count === 0` and total cards > 0 → Show "Caught Up" message (US-022)
4. If `count === 0` and total cards === 0 → Show "No Cards" message (US-021)
5. If `count > 0` → Initialize StudySessionActive with due cards

### 5.2. Reviewing a Card (US-018)

1. Display card front
2. User clicks "Show Answer" → Flip card to show back
3. User clicks "Forgot" or "Knew"
4. Call `srs.service.scheduleCard(card, rating)` to calculate new SRS data
5. Call `PATCH /flashcards/:id/review` with new SRS data
6. Increment `currentCardIndex`
7. If more cards → Show next card (front only, reset flip state)
8. If no more cards → Show completion message (US-019)

### 5.3. Completing a Session (US-019)

1. After last card is graded → Set `sessionComplete = true`
2. Display completion message: "Session Complete! Congratulations!"
3. Show button: "Return to my flashcards" → Navigate to `/my-flashcards`
4. Optionally show session stats (e.g., "You reviewed 15 cards")

---

## 6. Empty States

### 6.1. No Cards in Deck (US-021)

**Condition**: `totalCards === 0`

**UI**:

- Icon: FileText or BookOpen
- Heading: "You don't have any flashcards to study"
- Description: "Create your first flashcard to start learning"
- CTA Button: "Create Flashcards" → `/create-flashcards`

### 6.2. No Cards Due (US-022)

**Condition**: `totalCards > 0 && dueCards.length === 0`

**UI**:

- Icon: CheckCircle or Coffee
- Heading: "You're all caught up!"
- Description: "No cards are due for review right now. Great job!"
- Optional: Show next review time
- CTA Button: "Return to My Flashcards" → `/my-flashcards`

---

## 7. Implementation Steps

### Step 1: Database Migration

1. Create migration file: `/supabase/migrations/YYYYMMDD_add_srs_columns.sql`
2. Add columns to `flashcards` table (see section 2.1)
3. Create index for due cards query (see section 2.2)
4. Run migration: `supabase db push`
5. Update `/src/db/database.types.ts` with new columns

### Step 2: Update Database Types

1. Run `supabase gen types typescript --local > src/db/database.types.ts`
2. Verify new SRS columns are present in `Flashcards` type

### Step 3: Create SRS Service

1. Install ts-fsrs: `npm install ts-fsrs`
2. Create `/src/lib/services/srs.service.ts`
3. Implement FSRS initialization and helper functions
4. Add TypeScript types for SRS data
5. Write unit tests for service functions

### Step 4: Implement API Endpoints

1. Create `/src/pages/api/flashcards/due.ts` (GET endpoint)
2. Create `/src/pages/api/flashcards/[id]/review.ts` (PATCH endpoint)
3. Add Zod schemas for request/response validation
4. Implement RLS-aware queries
5. Test endpoints with authenticated requests

### Step 5: Create UI Components

1. Create `/src/components/StudySession.tsx` (main component)
2. Create `/src/components/GradingButtons.tsx`
3. Create `/src/components/StudySessionEmpty.tsx`
4. Create `/src/components/StudySessionCaughtUp.tsx`
5. Create `/src/components/StudySessionComplete.tsx`
6. Update `/src/components/FlashCard.tsx` for study mode

### Step 6: Update Study Session Page

1. Update `/src/pages/study-session.astro`
2. Remove placeholder content
3. Add StudySession React island
4. Implement data fetching with React Query
5. Handle loading and error states

### Step 7: Initialize New Cards

1. Update `POST /flashcards` endpoint to initialize SRS fields for new cards
2. Set `srs_state = 'New'`, `srs_due = now()` for new cards
3. Ensure all existing cards have default SRS values (migration or backfill)

### Step 8: Testing

1. Test study session with 0 cards (US-021)
2. Test study session with cards but none due (US-022)
3. Test full study session flow (US-017, US-018, US-019)
4. Test "Forgot" button updates card correctly
5. Test "Knew" button updates card correctly
6. Test session completion and navigation
7. Test responsive design on mobile/tablet/desktop
8. Test keyboard navigation and accessibility

### Step 9: Integration Testing

1. Create new cards via "Create Flashcards" page
2. Verify new cards appear in study session immediately
3. Review cards with "Forgot" and "Knew"
4. Verify cards disappear from due list after review
5. Verify cards reappear when due date passes
6. Test edge cases (single card, many cards, mixed states)

### Step 10: Documentation

1. Update README with study session feature description
2. Document SRS algorithm choice and rationale
3. Add comments to SRS service explaining FSRS parameters
4. Update API documentation with new endpoints

---

## 8. FSRS Rating Mapping

The ts-fsrs library uses a 4-point rating scale, but the PRD specifies only 2 buttons ("Forgot" and "Knew"). We'll map these to FSRS ratings:

| User Action | FSRS Rating  | Value | Description                       |
| ----------- | ------------ | ----- | --------------------------------- |
| "Forgot"    | Rating.Again | 1     | Complete failure to recall        |
| "Knew"      | Rating.Good  | 3     | Correct response with some effort |

**Note**: FSRS also supports Rating.Hard (2) and Rating.Easy (4), which can be added in future iterations for more granular feedback.

---

## 9. Default FSRS Parameters

The ts-fsrs library uses default parameters optimized for general learning. For the MVP, we'll use these defaults:

```typescript
const fsrs = new FSRS({
  // Default parameters - scientifically optimized
  // Can be customized per-user in future versions
});
```

**Future Enhancement**: Allow users to adjust parameters like:

- `maximum_interval`: Max days between reviews (default: 36500)
- `request_retention`: Target retention rate (default: 0.9)
- `enable_fuzz`: Add randomness to scheduling (default: false)

---

## 10. Error Handling

### API Errors

- **Network failure**: Show toast "Unable to save review. Please try again."
- **401 Unauthorized**: Redirect to login page
- **404 Not Found**: Show toast "Card not found" and skip to next card
- **500 Server Error**: Show toast "Server error. Please try again later."

### Client-Side Errors

- **FSRS calculation error**: Log error, use fallback scheduling (e.g., +1 day)
- **Invalid card data**: Skip card and log warning
- **Empty due cards array**: Show appropriate empty state

### Recovery Strategy

- Preserve session state in React state (don't refetch on error)
- Allow user to retry failed review
- Don't mark card as reviewed if API call fails

---

## 11. Performance Considerations

### Optimization Strategies

1. **Fetch all due cards once**: No pagination needed for study session
2. **Client-side scheduling**: FSRS calculations happen in browser (fast)
3. **Batch updates**: Consider batching review updates if session has many cards
4. **Optimistic UI**: Update UI immediately, sync with server in background
5. **Prefetch next card**: Preload next card's data while user reviews current card

### Expected Performance

- **Initial load**: < 500ms (fetch due cards)
- **Card flip**: Instant (client-side state)
- **Grade card**: < 200ms (API call + next card render)
- **Session complete**: Instant (client-side state)

---

## 12. Accessibility

### Keyboard Navigation

- `Space` or `Enter`: Show answer / Flip card
- `1` or `F`: "Forgot" button
- `2` or `K`: "Knew" button
- `Esc`: Exit study session (with confirmation)

### Screen Reader Support

- Announce current card number (e.g., "Card 3 of 15")
- Announce when answer is revealed
- Announce when card is graded
- Announce session completion

### Visual Accessibility

- High contrast for buttons
- Clear focus indicators
- Large touch targets (min 44x44px)
- Support for dark mode

---

## 13. Future Enhancements (Out of Scope for MVP)

1. **Study session statistics**: Track daily streak, cards reviewed, retention rate
2. **Custom study sessions**: Filter by date range, card source, or difficulty
3. **Advanced grading**: Add "Hard" and "Easy" buttons (4-point scale)
4. **Study reminders**: Notify users when cards are due
5. **Undo last review**: Allow users to correct mistakes
6. **Study session history**: View past sessions and performance
7. **Adaptive parameters**: Optimize FSRS parameters based on user performance
8. **Study session timer**: Track time spent per card
9. **Keyboard shortcuts**: Customizable hotkeys for power users
10. **Study session pause**: Save progress and resume later

---

## 14. Success Criteria

The study session feature will be considered successfully implemented when:

1. ✅ Users can start a study session and see due cards (US-017)
2. ✅ Users can review cards with "Show Answer" and grade with "Forgot"/"Knew" (US-018)
3. ✅ Users see completion message after reviewing all due cards (US-019)
4. ✅ Empty state shown when user has no cards (US-021)
5. ✅ "Caught up" message shown when no cards are due (US-022)
6. ✅ Cards are rescheduled correctly based on FSRS algorithm
7. ✅ Study session works on mobile, tablet, and desktop
8. ✅ Study session is accessible via keyboard and screen reader
9. ✅ No performance issues with up to 100 due cards
10. ✅ All API endpoints are protected by authentication and RLS

---

## 15. Testing Checklist

### Unit Tests

- [ ] SRS service: `scheduleCard()` with "Forgot" rating
- [ ] SRS service: `scheduleCard()` with "Knew" rating
- [ ] SRS service: `getDueCards()` filters correctly
- [ ] SRS service: Card state transitions (New → Learning → Review)

### Integration Tests

- [ ] GET /flashcards/due returns only due cards for authenticated user
- [ ] PATCH /flashcards/:id/review updates SRS fields correctly
- [ ] PATCH /flashcards/:id/review rejects invalid ratings
- [ ] RLS prevents accessing other users' cards

### E2E Tests

- [ ] Complete study session flow (start → review → complete)
- [ ] Empty state shown when no cards exist
- [ ] "Caught up" state shown when no cards due
- [ ] "Forgot" button reschedules card sooner
- [ ] "Knew" button reschedules card later
- [ ] Session completion navigates to "My Flashcards"
- [ ] Study session works after creating new cards

### Manual Tests

- [ ] Responsive design on mobile (iOS/Android)
- [ ] Responsive design on tablet
- [ ] Responsive design on desktop
- [ ] Dark mode support
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Touch gestures work on mobile
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Network failure recovery works

---

## 16. Dependencies

### NPM Packages

- `ts-fsrs@^5.2.3`: Spaced repetition algorithm

### Database

- PostgreSQL 14+ (Supabase)
- New columns on `flashcards` table
- New index for due cards query

### API

- Supabase Auth (existing)
- Supabase PostgREST (existing)

### Frontend

- React 19 (existing)
- React Query (existing)
- Shadcn/ui components (existing)

---

## 17. Risk Assessment

### Technical Risks

| Risk                            | Impact | Likelihood | Mitigation                                    |
| ------------------------------- | ------ | ---------- | --------------------------------------------- |
| FSRS library incompatibility    | High   | Low        | Test thoroughly, have fallback to simple SM-2 |
| Performance with many due cards | Medium | Medium     | Implement pagination if needed                |
| Client-side calculation errors  | Medium | Low        | Add error boundaries and fallbacks            |
| Database migration issues       | High   | Low        | Test migration on staging first               |

### User Experience Risks

| Risk                              | Impact | Likelihood | Mitigation                               |
| --------------------------------- | ------ | ---------- | ---------------------------------------- |
| Users confused by 2-button system | Medium | Medium     | Add tooltips and help text               |
| Users abandon long sessions       | Medium | High       | Show progress indicator                  |
| Users forget to review regularly  | Low    | High       | Out of scope for MVP (future: reminders) |

---

## 18. Documentation Requirements

### Developer Documentation

- [ ] SRS service API documentation
- [ ] FSRS algorithm explanation
- [ ] Database schema changes
- [ ] API endpoint specifications
- [ ] Component props and usage

### User Documentation

- [ ] How to start a study session
- [ ] What "Forgot" and "Knew" mean
- [ ] How the spaced repetition algorithm works
- [ ] Best practices for effective studying

---

## Conclusion

This plan provides a complete roadmap for implementing the Study Session feature using the ts-fsrs library. The implementation follows the existing architecture patterns, integrates seamlessly with the current codebase, and delivers all required user stories (US-017, US-018, US-019, US-021, US-022) while maintaining simplicity and performance.
