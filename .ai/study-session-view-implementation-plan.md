# View Implementation Plan: Study Session

## 1. Overview

The Study Session view enables users to review flashcards using spaced repetition. It fetches due cards, displays them one at a time, allows users to reveal answers and self-grade (Forgot/Knew), and tracks progress. The view handles three empty states: no cards exist, no cards are due, and session complete. All SRS calculations are performed client-side using the ts-fsrs library, with optimistic UI updates and server synchronization.

## 2. View Routing

- **Path:** `/study-session`
- **Access:** Protected (requires authentication)
- **Layout:** Protected Layout (includes persistent header with navigation)

## 3. Component Structure

```
StudySessionPage (Astro)
└── StudySession (React)
    ├── StudySessionEmpty (no cards exist)
    │   ├── Icon
    │   ├── Heading
    │   ├── Description
    │   └── Button → /create-flashcards
    ├── StudySessionCaughtUp (no cards due)
    │   ├── Icon
    │   ├── Heading
    │   └── Description
    ├── StudySessionActive (active study)
    │   ├── Progress indicator
    │   ├── FlashCard (showAnswerButton=true)
    │   ├── Button "Show Answer"
    │   └── GradingButtons (Forgot/Knew)
    └── StudySessionComplete (session finished)
        ├── Icon
        ├── Heading
        ├── Stats display
        └── Button → /my-flashcards
```

## 4. Component Details

### StudySessionPage (Astro Component)

- **Component description:** Top-level Astro page that wraps the React StudySession component. Provides the page structure and ensures proper SSR configuration.

- **Main elements:**
  - Page container with proper semantic HTML
  - StudySession React component with client:load directive
  - Meta tags for SEO

- **Handled interactions:** None (delegates to React component)

- **Handled validation:** None (authentication handled by middleware)

- **Types:** None

- **Props:** None (top-level page)

### StudySession (React Component)

- **Component description:** Main orchestrator component managing the entire study session flow. Fetches due cards, manages session state, handles card progression, coordinates with FSRS library, and determines which sub-component to render based on current state.

- **Main elements:**
  - Conditional rendering of child components based on session state
  - Loading state during initial fetch
  - Error boundary for API failures

- **Handled interactions:**
  - Initial fetch of due cards on mount
  - Card progression after grading
  - Navigation to other pages

- **Handled validation:**
  - Validates API response structure
  - Ensures card data integrity before FSRS calculations

- **Types:**
  - `FlashcardWithSrsDto` (from API)
  - `GetDueFlashcardsResponseDto` (API response)
  - `StudySessionState` (view model)
  - `Card` from ts-fsrs library

- **Props:** None (top-level React component)

### StudySessionEmpty (React Component)

- **Component description:** Empty state displayed when user has zero total flashcards. Encourages user to create their first cards.

- **Main elements:**
  - Icon (e.g., BookOpen from lucide-react)
  - Heading: "You don't have any flashcards to study"
  - Description: Helpful message explaining next steps
  - Button linking to `/create-flashcards`

- **Handled interactions:**
  - Click button to navigate to create page

- **Handled validation:** None

- **Types:** None

- **Props:** None

### StudySessionCaughtUp (React Component)

- **Component description:** Empty state displayed when user has cards but none are currently due for review. Celebrates user's progress.

- **Main elements:**
  - Icon (e.g., CheckCircle from lucide-react)
  - Heading: "You're all caught up!"
  - Description: "No cards are due for review right now."

- **Handled interactions:** None (informational only)

- **Handled validation:** None

- **Types:** None

- **Props:** None

### StudySessionActive (React Component)

- **Component description:** Active study interface displaying current card, progress, and grading controls. Manages card flip state and grading button visibility.

- **Main elements:**
  - Progress indicator (e.g., "Card 3 of 15")
  - FlashCard component with showAnswerButton={true}
  - "Show Answer" button (visible when answer hidden)
  - GradingButtons component (visible after answer revealed)

- **Handled interactions:**
  - Click "Show Answer" to reveal card back
  - Click "Forgot" or "Knew" to grade and advance

- **Handled validation:**
  - Ensures answer is revealed before grading
  - Validates FSRS calculation results

- **Types:**
  - `FlashcardWithSrsDto`
  - `Card` from ts-fsrs
  - `RecordLog` from ts-fsrs

- **Props:**
  - `currentCard: FlashcardWithSrsDto`
  - `currentIndex: number`
  - `totalCards: number`
  - `onGrade: (rating: Rating) => void`

### StudySessionComplete (React Component)

- **Component description:** Completion screen displayed after all due cards are reviewed. Shows session statistics and provides navigation back to flashcards list.

- **Main elements:**
  - Icon (e.g., Trophy or Star from lucide-react)
  - Heading: "Session Complete! Congratulations!"
  - Stats display (cards reviewed, time spent, etc.)
  - Button: "Return to my flashcards" → `/my-flashcards`

- **Handled interactions:**
  - Click button to navigate to my-flashcards page

- **Handled validation:** None

- **Types:**
  - `SessionStats` (view model)

- **Props:**
  - `stats: SessionStats`

### FlashCard (React Component - Reused)

- **Component description:** Reusable flashcard visualization component. In study mode, disables click-to-flip and shows "Show Answer" button below card. No action buttons (Edit/Delete/Accept) are displayed in study mode.

- **Main elements:**
  - Card container with flip animation
  - Front text display
  - Back text display (after flip)
  - Conditional "Show Answer" button (when showAnswerButton=true)

- **Handled interactions:**
  - Click card to flip (disabled when showAnswerButton=true)
  - Click "Show Answer" button to flip (when showAnswerButton=true)

- **Handled validation:** None

- **Types:**
  - `FlashcardDto` or `FlashcardWithSrsDto`

- **Props:**
  - `front: string`
  - `back: string`
  - `showAnswerButton?: boolean`
  - `onFlip?: () => void`
  - `isFlipped?: boolean`

### GradingButtons (React Component)

- **Component description:** Two-button interface for self-grading. Displays "Forgot" and "Knew" buttons with clear visual distinction.

- **Main elements:**
  - "Forgot" button (Rating.Again = 1 in FSRS)
  - "Knew" button (Rating.Good = 3 in FSRS)
  - Keyboard shortcut hints (1/F for Forgot, 2/K for Knew)

- **Handled interactions:**
  - Click "Forgot" to grade as forgotten
  - Click "Knew" to grade as known
  - Keyboard shortcuts (1, F, 2, K)

- **Handled validation:** None

- **Types:**
  - `Rating` from ts-fsrs

- **Props:**
  - `onGrade: (rating: Rating) => void`
  - `disabled?: boolean`

## 5. Types

### Existing Types (from types.ts)

```typescript
// Already defined in types.ts
export type FlashcardWithSrsDto = FlashcardDto & {
  srs_state: string | null;
  srs_due: string | null;
  srs_stability: number | null;
  srs_difficulty: number | null;
  srs_reps: number | null;
  srs_lapses: number | null;
  last_reviewed: string | null;
};

export interface GetDueFlashcardsResponseDto {
  data: FlashcardWithSrsDto[];
  count: number;
}

export interface ReviewFlashcardCommand {
  rating: number;
  srs_state: string;
  srs_due: string;
  srs_stability: number;
  srs_difficulty: number;
  srs_elapsed_days: number;
  srs_scheduled_days: number;
  srs_reps: number;
  srs_lapses: number;
}

export type ReviewFlashcardResponseDto = Pick<
  FlashcardWithSrsDto,
  "id" | "front" | "back" | "srs_state" | "srs_due" | "last_reviewed"
>;
```

### New View Model Types (to be added)

```typescript
/**
 * Represents the current state of the study session.
 */
export type StudySessionStatus =
  | "loading" // Initial fetch in progress
  | "empty" // User has 0 total cards
  | "caught-up" // User has cards but 0 are due
  | "active" // Study session in progress
  | "complete" // All due cards reviewed
  | "error"; // API error occurred

/**
 * View model for the entire study session state.
 */
export interface StudySessionState {
  status: StudySessionStatus;
  cards: FlashcardWithSrsDto[];
  currentIndex: number;
  isAnswerRevealed: boolean;
  stats: SessionStats;
  error: string | null;
}

/**
 * Statistics tracked during a study session.
 */
export interface SessionStats {
  totalReviewed: number;
  forgotCount: number;
  knewCount: number;
  startTime: Date;
  endTime: Date | null;
}

/**
 * Extended flashcard type with FSRS Card instance.
 */
export interface StudyCard extends FlashcardWithSrsDto {
  fsrsCard: Card; // from ts-fsrs library
}
```

## 6. State Management

State is managed within the StudySession React component using useState and useEffect hooks. A custom hook `useStudySession` encapsulates all session logic.

### Custom Hook: useStudySession

```typescript
interface UseStudySessionReturn {
  state: StudySessionState;
  showAnswer: () => void;
  gradeCard: (rating: Rating) => Promise<void>;
}

function useStudySession(): UseStudySessionReturn;
```

**Responsibilities:**

- Fetch due cards on mount
- Initialize FSRS scheduler
- Convert FlashcardWithSrsDto to FSRS Card objects
- Manage current card index and flip state
- Handle grading with FSRS calculations
- Optimistically update UI and sync with server
- Track session statistics
- Determine session status

**State Variables:**

- `status: StudySessionStatus` - Current session state
- `cards: StudyCard[]` - Array of due cards with FSRS instances
- `currentIndex: number` - Index of current card (0-based)
- `isAnswerRevealed: boolean` - Whether back of card is shown
- `stats: SessionStats` - Session statistics
- `error: string | null` - Error message if API fails

**Key Functions:**

- `fetchDueCards()` - Calls GET /flashcards/due
- `initializeFSRS()` - Creates FSRS scheduler instance
- `convertToFSRSCard()` - Converts DTO to FSRS Card
- `showAnswer()` - Sets isAnswerRevealed to true
- `gradeCard(rating)` - Performs FSRS calculation, updates server, advances to next card
- `calculateStats()` - Computes session statistics

**Side Effects:**

- useEffect on mount: fetch due cards
- useEffect on cards change: determine status (empty/caught-up/active)
- useEffect on currentIndex: check if session complete
- Keyboard event listeners for shortcuts

## 7. API Integration

### GET /flashcards/due

**When:** Called once on component mount

**Request:**

- Method: GET
- Endpoint: `/api/flashcards/due`
- Headers: Authentication handled by Supabase client
- Body: None

**Response Type:** `GetDueFlashcardsResponseDto`

```typescript
{
  data: FlashcardWithSrsDto[];
  count: number;
}
```

**Error Handling:**

- 401 Unauthorized: Redirect to login (handled by middleware)
- 500 Internal Server Error: Display error state with retry option

**Implementation:**

```typescript
const response = await fetch("/api/flashcards/due");
const result: GetDueFlashcardsResponseDto = await response.json();
```

### PATCH /flashcards/:id/review

**When:** Called after each card is graded (Forgot or Knew)

**Request:**

- Method: PATCH
- Endpoint: `/api/flashcards/${cardId}/review`
- Headers: Content-Type: application/json
- Body: `ReviewFlashcardCommand`

**Request Type:** `ReviewFlashcardCommand`

```typescript
{
  rating: number; // 1 = Forgot, 3 = Knew
  srs_state: string; // Calculated by FSRS
  srs_due: string; // ISO datetime
  srs_stability: number;
  srs_difficulty: number;
  srs_elapsed_days: number;
  srs_scheduled_days: number;
  srs_reps: number;
  srs_lapses: number;
}
```

**Response Type:** `ReviewFlashcardResponseDto`

```typescript
{
  id: number;
  front: string;
  back: string;
  srs_state: string | null;
  srs_due: string | null;
  last_reviewed: string | null;
}
```

**Error Handling:**

- 400 Bad Request: Log error, continue session (optimistic update already applied)
- 404 Not Found: Log error, continue session
- 500 Internal Server Error: Log error, continue session

**Implementation:**

```typescript
const response = await fetch(`/api/flashcards/${cardId}/review`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(reviewCommand),
});
const result: ReviewFlashcardResponseDto = await response.json();
```

**Optimistic Update Strategy:**

- Update UI immediately after grading
- Send API request in background
- If request fails, log error but don't revert UI (user continues session)
- Failed updates can be retried or handled in next session

## 8. User Interactions

### 1. Start Study Session

**Trigger:** User navigates to `/study-session`

**Flow:**

1. Component mounts
2. Display loading state
3. Fetch due cards from API
4. Determine session status based on card count
5. Render appropriate component

**Expected Outcome:**

- If 0 total cards: Show StudySessionEmpty
- If cards exist but 0 due: Show StudySessionCaughtUp
- If cards are due: Show StudySessionActive with first card

### 2. View Card Front

**Trigger:** StudySessionActive renders

**Flow:**

1. Display current card front text
2. Show progress indicator (e.g., "Card 1 of 15")
3. Show "Show Answer" button
4. Hide grading buttons

**Expected Outcome:**

- User sees card front and can read/think about answer

### 3. Reveal Answer

**Trigger:** User clicks "Show Answer" button or presses Space/Enter

**Flow:**

1. Call showAnswer() function
2. Set isAnswerRevealed to true
3. Trigger card flip animation
4. Display card back text
5. Show grading buttons (Forgot/Knew)
6. Hide "Show Answer" button

**Expected Outcome:**

- Card flips to show back text
- Grading buttons become visible
- User can now grade themselves

### 4. Grade Card as "Forgot"

**Trigger:** User clicks "Forgot" button or presses 1/F key

**Flow:**

1. Call gradeCard(Rating.Again) where Rating.Again = 1
2. Get current card's FSRS Card instance
3. Calculate new scheduling with FSRS: scheduler.repeat(card, now)
4. Extract RecordLog for Rating.Again
5. Build ReviewFlashcardCommand from RecordLog
6. Optimistically advance to next card
7. Send PATCH request to server
8. Update stats (increment forgotCount)
9. Reset isAnswerRevealed to false

**Expected Outcome:**

- UI immediately shows next card (or completion screen)
- Server receives update in background
- Progress indicator updates

### 5. Grade Card as "Knew"

**Trigger:** User clicks "Knew" button or presses 2/K key

**Flow:**

1. Call gradeCard(Rating.Good) where Rating.Good = 3
2. Get current card's FSRS Card instance
3. Calculate new scheduling with FSRS: scheduler.repeat(card, now)
4. Extract RecordLog for Rating.Good
5. Build ReviewFlashcardCommand from RecordLog
6. Optimistically advance to next card
7. Send PATCH request to server
8. Update stats (increment knewCount)
9. Reset isAnswerRevealed to false

**Expected Outcome:**

- UI immediately shows next card (or completion screen)
- Server receives update in background
- Progress indicator updates

### 6. Complete Session

**Trigger:** User grades the last due card

**Flow:**

1. Increment currentIndex past last card
2. Set status to "complete"
3. Calculate final stats (endTime, totalReviewed)
4. Render StudySessionComplete component
5. Display congratulations message and stats

**Expected Outcome:**

- User sees completion screen with statistics
- "Return to my flashcards" button is available

### 7. Navigate After Completion

**Trigger:** User clicks "Return to my flashcards" button

**Flow:**

1. Navigate to `/my-flashcards` using Astro navigation

**Expected Outcome:**

- User is redirected to flashcards list page

### 8. Keyboard Shortcuts

**Available Shortcuts:**

- Space or Enter: Show answer (when answer hidden)
- 1 or F: Grade as "Forgot" (when answer revealed)
- 2 or K: Grade as "Knew" (when answer revealed)

**Implementation:**

- Add keydown event listener in useEffect
- Check current state (answer revealed or not)
- Call appropriate function based on key pressed
- Announce action to screen readers

## 9. Conditions and Validation

### Session Status Determination

**Condition 1: Empty State**

- **Check:** `cards.length === 0` after initial fetch
- **Component:** StudySessionEmpty
- **Validation:** Verify API returned empty array, not error

**Condition 2: Caught Up State**

- **Check:** `cards.length > 0` but `dueCards.length === 0`
- **Component:** StudySessionCaughtUp
- **Note:** This requires checking total cards vs due cards. Since API only returns due cards, we need to infer: if API returns 0 cards but user has accessed the app before, assume caught up. For MVP, treat same as empty and show StudySessionEmpty.

**Simplified for MVP:**

- If API returns 0 cards: Show StudySessionEmpty (covers both US-021 and US-022)
- If API returns >0 cards: Show StudySessionActive

**Condition 3: Active State**

- **Check:** `cards.length > 0` and `currentIndex < cards.length`
- **Component:** StudySessionActive
- **Validation:** Ensure currentIndex is valid array index

**Condition 4: Complete State**

- **Check:** `currentIndex >= cards.length` and `cards.length > 0`
- **Component:** StudySessionComplete
- **Validation:** Ensure all cards were graded

### Answer Reveal Validation

**Condition:** User must reveal answer before grading

- **Check:** `isAnswerRevealed === true`
- **Enforcement:** Grading buttons only rendered when isAnswerRevealed is true
- **UI:** "Show Answer" button hidden when isAnswerRevealed is true

### FSRS Data Validation

**Condition:** Card must have valid SRS data for FSRS conversion

- **Check:** Validate srs_state, srs_due, srs_stability, srs_difficulty exist
- **Fallback:** If null, treat as new card with default FSRS values
- **Implementation:**

```typescript
const fsrsCard = card.srs_state
  ? new Card({
      /* existing data */
    })
  : new Card(); // New card with defaults
```

### API Response Validation

**Condition:** API response must match expected schema

- **Check:** Validate response structure before processing
- **Validation:**
  - Response has `data` array
  - Response has `count` number
  - Each card has required fields (id, front, back)
- **Error Handling:** If validation fails, show error state

## 10. Error Handling

### API Fetch Error (GET /flashcards/due)

**Scenario:** Network error, server error, or timeout during initial fetch

**Handling:**

1. Catch error in try-catch block
2. Set status to "error"
3. Set error message: "Failed to load flashcards. Please try again."
4. Display error state with retry button
5. Log error to console for debugging

**UI:**

- Error icon
- Error message
- "Retry" button that calls fetchDueCards() again

### API Update Error (PATCH /flashcards/:id/review)

**Scenario:** Network error or server error during card review update

**Handling:**

1. Log error to console
2. Continue session (don't block user)
3. Optimistic update remains in UI
4. Consider retry logic or queue for later sync

**Rationale:** User experience is prioritized. Failed updates can be reconciled in next session when card becomes due again.

### Invalid Card Data

**Scenario:** Card missing required fields or has malformed data

**Handling:**

1. Skip invalid card
2. Log warning to console
3. Continue with next card
4. Adjust totalCards count in progress indicator

### FSRS Calculation Error

**Scenario:** FSRS library throws error during scheduling calculation

**Handling:**

1. Catch error in try-catch block
2. Log error to console
3. Use fallback scheduling (e.g., 1 day for Forgot, 3 days for Knew)
4. Continue session

### Empty State Navigation

**Scenario:** User clicks "Create Flashcards" from empty state

**Handling:**

- Standard Astro navigation to `/create-flashcards`
- No special error handling needed

### Keyboard Shortcut Conflicts

**Scenario:** User presses shortcut key at wrong time

**Handling:**

- Check current state before executing action
- Ignore invalid shortcuts (e.g., grading before revealing answer)
- Provide visual feedback for valid shortcuts

### Authentication Error

**Scenario:** User session expires during study session

**Handling:**

- Middleware redirects to login
- Session state is lost (acceptable for MVP)
- Future enhancement: Save session state to localStorage

## 11. Implementation Steps

### Step 1: Install Dependencies

```bash
npm install ts-fsrs
```

Verify ts-fsrs is added to package.json.

### Step 2: Create Type Definitions

Add new view model types to `/src/types.ts`:

- `StudySessionStatus`
- `StudySessionState`
- `SessionStats`
- `StudyCard`

### Step 3: Create Utility Functions

Create `/src/lib/utils/fsrs.ts`:

- `initializeFSRS()` - Creates FSRS scheduler instance
- `convertToFSRSCard(flashcard: FlashcardWithSrsDto): Card` - Converts DTO to FSRS Card
- `buildReviewCommand(recordLog: RecordLog, rating: Rating): ReviewFlashcardCommand` - Builds API payload from FSRS result

### Step 4: Create Custom Hook

Create `/src/hooks/useStudySession.ts`:

- Implement state management logic
- Implement fetchDueCards()
- Implement showAnswer()
- Implement gradeCard()
- Implement keyboard event listeners
- Export useStudySession hook

### Step 5: Create Child Components

Create the following components in `/src/components/study-session/`:

**StudySessionEmpty.tsx:**

- Empty state for no cards
- Link to create-flashcards page

**StudySessionCaughtUp.tsx:**

- Empty state for no due cards
- Celebratory message

**StudySessionActive.tsx:**

- Progress indicator
- FlashCard component integration
- Show Answer button
- GradingButtons component

**StudySessionComplete.tsx:**

- Completion message
- Stats display
- Return button

**GradingButtons.tsx:**

- Forgot button
- Knew button
- Keyboard shortcut hints

### Step 6: Update FlashCard Component

Modify existing `/src/components/FlashCard.tsx`:

- Add `showAnswerButton?: boolean` prop
- Add `onFlip?: () => void` prop
- Add `isFlipped?: boolean` prop
- Disable click-to-flip when showAnswerButton is true
- Render "Show Answer" button when showAnswerButton is true
- Hide action buttons (Edit/Delete/Accept) in study mode

### Step 7: Create Main StudySession Component

Create `/src/components/StudySession.tsx`:

- Import useStudySession hook
- Implement conditional rendering based on status
- Handle loading state
- Handle error state
- Pass props to child components

### Step 8: Create Astro Page

Create `/src/pages/study-session.astro`:

- Import StudySession component
- Add client:load directive
- Set up page layout
- Add meta tags
- Ensure `export const prerender = false` for SSR

### Step 9: Implement Accessibility

- Add ARIA labels to buttons
- Add aria-live region for progress announcements
- Add screen reader text for card flip
- Ensure keyboard navigation works
- Test with screen reader
- Verify focus management

### Step 10: Add Keyboard Shortcuts

In useStudySession hook:

- Add keydown event listener
- Map keys to actions (Space/Enter, 1/F, 2/K)
- Prevent default browser behavior
- Announce shortcuts to screen readers

### Step 11: Style Components

Using Tailwind CSS:

- Style progress indicator
- Style grading buttons with clear visual distinction
- Ensure responsive design (mobile, tablet, desktop)
- Add animations for card flip
- Ensure minimum touch target size (44x44px)
- Add focus indicators

### Step 12: Test Empty States

- Test with user who has 0 cards
- Test with user who has cards but 0 due
- Verify correct messages and navigation links

### Step 13: Test Active Session

- Test with multiple due cards
- Verify card progression
- Test answer reveal
- Test both grading options
- Verify progress indicator updates
- Test keyboard shortcuts

### Step 14: Test Completion Flow

- Complete a full session
- Verify completion message
- Verify stats display
- Test return button navigation

### Step 15: Test Error Scenarios

- Simulate API fetch error
- Simulate API update error
- Test with invalid card data
- Verify error messages and retry functionality

### Step 16: Performance Testing

- Test with large number of due cards (50+)
- Verify smooth animations
- Check for memory leaks
- Optimize re-renders if needed

### Step 17: Integration Testing

- Test navigation from header
- Test navigation to/from other pages
- Verify authentication protection
- Test logout during session

### Step 18: Accessibility Audit

- Run automated accessibility tests
- Manual keyboard navigation test
- Screen reader test (VoiceOver/NVDA)
- Color contrast verification
- Focus indicator visibility

### Step 19: Documentation

- Add JSDoc comments to functions
- Document FSRS integration approach
- Document keyboard shortcuts in UI
- Update project documentation

### Step 20: Code Review and Refinement

- Review code for consistency with project patterns
- Ensure error handling is comprehensive
- Verify type safety
- Optimize bundle size if needed
- Final testing across browsers
