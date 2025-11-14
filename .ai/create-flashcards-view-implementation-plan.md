# View Implementation Plan: Create Flashcards

## 1. Overview

The Create Flashcards view is a protected page that enables users to generate flashcards via AI or create them manually. The view consists of a text input area for source material (1,000-10,000 characters), an AI generation trigger button, a review list for AI-generated candidates, and manual creation capability (triggered with button). Users can accept, edit, or delete AI candidates before saving them to their deck. The entire page is implemented as a single React island with local state management for the review workflow.

## 2. View Routing

- **Path**: `/create-flashcards`
- **Access**: Protected (requires authentication)
- **File Location**: `src/pages/create-flashcards.astro`

## 3. Component Structure

```
CreateFlashcardsPage (Astro)
└── CreateFlashcardsContainer (React Island)
    ├── SourceTextInput (React)
    │   ├── Textarea
    │   ├── CharacterCounter
    │   └── GenerateButton
    ├── ManualAddButton (React)
    ├── CandidateReviewList (React)
    │   ├── SkeletonLoader (conditional)
    │   ├── ErrorMessage (conditional)
    │   └── CandidateCard[] (React)
    │       ├── FlashCard (display component)
    │       └── CardActions
    │           ├── AcceptButton
    │           ├── EditButton
    │           └── DeleteButton
    ├── SaveAllButton (React)
    ├── FlashcardAddEditModal (React)
    │   ├── FrontInput
    │   ├── BackInput
    │   ├── SaveButton
    │   └── CancelButton
    └── ConfirmRegenerateModal (React)
        ├── Title
        ├── Description
        ├── CancelButton
        └── ConfirmButton
```

## 4. Component Details

### CreateFlashcardsPage (Astro)

- **Description**: The main Astro page component that wraps the React island. Handles route protection and provides the layout structure.
- **Main elements**:
  - Page layout wrapper
  - `<CreateFlashcardsContainer client:load />` React island
- **Handled events**: None (static wrapper)
- **Validation conditions**: None at this level
- **Types**: None specific
- **Props**: None

### CreateFlashcardsContainer (React)

- **Description**: The main React component managing the entire flashcard creation workflow. Orchestrates state for source text, AI candidates, manual cards, and the save flow.
- **Main elements**:
  - `<SourceTextInput />` for text input and generation
  - `<ManualAddButton />` to trigger manual card creation
  - `<CandidateReviewList />` to display and manage candidates
  - `<SaveAllButton />` to persist approved cards
  - `<FlashcardAddEditModal />` for add/edit operations
  - `<ConfirmRegenerateModal />` for confirming regeneration when unsaved AI candidates exist
- **Handled events**:
  - `onGenerateCandidates`: Calls `POST /api/generations/generate-candidates`
  - `onSaveAll`: Calls `POST /api/generations` (if any AI generated candidates), then `POST /api/flashcards`
  - `onOpenManualAdd`: Opens modal in add mode
  - `onModalSave`: Handles both add and edit operations
- **Validation conditions**:
  - Source text must be 1,000-10,000 characters before generation
  - At least one card must be accepted/edited before save
- **Types**: `CreateFlashcardsState`, `CandidateCardViewModel`
- **Props**: None (root component)

### SourceTextInput (React)

- **Description**: Card containing textarea with character counter and generate button. Validates character length and provides visual feedback.
- **Main elements**:
  - `<textarea>` with `rows={10}` and appropriate styling
  - Character counter display showing `{current}/{max}` format
  - `<GenerateButton />` with loading spinner state
- **Handled events**:
  - `onChange`: Updates source text state and validates length
  - `onGenerate`: Triggers AI generation if validation passes
- **Validation conditions**:
  - Minimum 1,000 characters (show error if less)
  - Maximum 10,000 characters (show error if more)
  - Generate button disabled if validation fails or during loading
- **Types**: `SourceTextInputProps`
- **Props**:
  - `value: string` - Current source text
  - `onChange: (value: string) => void` - Text change handler
  - `onGenerate: () => void` - Generate trigger
  - `isGenerating: boolean` - Loading state
  - `disabled: boolean` - Disable during operations

### ManualAddButton (React)

- **Description**: Button that opens the modal in "Add Mode" for manual flashcard creation.
- **Main elements**:
  - `<Button variant="outline">` with "Add Manually" text and icon
- **Handled events**:
  - `onClick`: Opens modal with empty fields
- **Validation conditions**: None
- **Types**: `ManualAddButtonProps`
- **Props**:
  - `onClick: () => void` - Click handler
  - `disabled: boolean` - Disabled during save operations

### CandidateReviewList (React)

- **Description**: Displays the list of AI-generated candidates and manually added cards. Shows skeleton loaders during generation, error messages on failure, or the list of candidate cards.
- **Main elements**:
  - Conditional rendering:
    - `<SkeletonLoader count={5} />` when `isLoading === true`
    - `<ErrorMessage />` when `error !== null`
    - `<CandidateCard />` array when candidates exist
  - Empty state message when no candidates
- **Handled events**: None (delegates to child components)
- **Validation conditions**: None at this level
- **Types**: `CandidateReviewListProps`, `CandidateCardViewModel[]`
- **Props**:
  - `candidates: CandidateCardViewModel[]` - List of candidates
  - `isLoading: boolean` - Loading state
  - `error: string | null` - Error message
  - `onAccept: (id: string) => void` - Accept handler
  - `onEdit: (id: string) => void` - Edit handler
  - `onDelete: (id: string) => void` - Delete handler

### CandidateCard (React)

- **Description**: Displays a single flashcard candidate with front/back content and action buttons. Visual state changes based on review status (unreviewed: greyed out, accepted/edited: full opacity with green checkmark).
- **Main elements**:
  - `<FlashCard front={front} back={back} />` display component
  - Action buttons container:
    - `<AcceptButton />` (checkmark icon)
    - `<EditButton />` (pencil icon)
    - `<DeleteButton />` (trash icon)
  - Status indicator (green checkmark for accepted/edited)
- **Handled events**:
  - `onAccept`: Marks card as accepted
  - `onEdit`: Opens modal with card data
  - `onDelete`: Removes card from list
- **Validation conditions**: None
- **Types**: `CandidateCardProps`, `CandidateCardViewModel`
- **Props**:
  - `candidate: CandidateCardViewModel` - Card data and state
  - `onAccept: () => void` - Accept handler
  - `onEdit: () => void` - Edit handler
  - `onDelete: () => void` - Delete handler

### SaveAllButton (React)

- **Description**: Final button to persist all accepted and edited cards to the database. Disabled when no cards are ready to save.
- **Main elements**:
  - `<Button variant="primary">` with "Save Cards" text
  - Loading spinner during save operation
- **Handled events**:
  - `onClick`: Triggers two-step save process (generation log + flashcards)
- **Validation conditions**:
  - Disabled if no cards have status "accepted" or "edited"
  - Disabled during save operation
- **Types**: `SaveAllButtonProps`
- **Props**:
  - `onClick: () => void` - Save handler
  - `disabled: boolean` - Disabled state
  - `isSaving: boolean` - Loading state
  - `count: number` - Number of cards to save

### FlashcardAddEditModal (React)

- **Description**: Universal modal for both adding new cards manually and editing existing candidates. Switches between "Add Mode" (empty fields) and "Edit Mode" (pre-filled fields).
- **Main elements**:
  - Modal overlay and container
  - Modal title (dynamic: "Add Flashcard" or "Edit Flashcard")
  - `<input>` for front text (max 200 chars)
  - `<textarea>` for back text (max 500 chars)
  - Character counters for both fields
  - `<Button variant="primary">` Save button
  - `<Button variant="ghost">` Cancel button
- **Handled events**:
  - `onSave`: Validates and saves card data
  - `onCancel`: Closes modal without saving
  - `onChange`: Updates field values
- **Validation conditions**:
  - Front: required, max 200 characters
  - Back: required, max 500 characters
  - Save button disabled if validation fails
- **Types**: `FlashcardAddEditModalProps`, `FlashcardFormData`
- **Props**:
  - `isOpen: boolean` - Modal visibility
  - `mode: "add" | "edit"` - Operation mode
  - `initialData?: FlashcardFormData` - Pre-filled data for edit mode
  - `onSave: (data: FlashcardFormData) => void` - Save handler
  - `onCancel: () => void` - Cancel handler

### ConfirmRegenerateModal (React)

- **Description**: Confirmation modal shown when user attempts to regenerate AI candidates while unsaved AI candidates exist.
- **Main elements**:
  - Modal overlay and container
  - Title: "Regenerate Flashcards?"
  - Description: Warning that AI candidates will be discarded, manual cards preserved
  - `<Button variant="outline">` Cancel button
  - `<Button variant="destructive">` Discard & Regenerate button
- **Handled events**:
  - `onConfirm`: Proceeds with regeneration, clearing AI candidates
  - `onCancel`: Closes modal without action
- **Validation conditions**: None
- **Types**: `ConfirmRegenerateModalProps`
- **Props**:
  - `isOpen: boolean` - Modal visibility
  - `onConfirm: () => void` - Confirm handler
  - `onCancel: () => void` - Cancel handler

### ConfirmPartialSaveModal (React)

- **Description**: Confirmation modal shown when user attempts to save flashcards while unreviewed AI candidates exist.
- **Main elements**:
  - Modal overlay and container
  - Title: "Save Partially Reviewed Flashcards?"
  - Description: Warning that unreviewed candidates will be discarded and counted as deleted
  - Count of unreviewed cards displayed
  - `<Button variant="outline">` Cancel button
  - `<Button variant="destructive">` Discard & Save button
- **Handled events**:
  - `onConfirm`: Proceeds with save, treating unreviewed as deleted
  - `onCancel`: Closes modal without action
- **Validation conditions**: None
- **Types**: `ConfirmPartialSaveModalProps`
- **Props**:
  - `isOpen: boolean` - Modal visibility
  - `unreviewedCount: number` - Count of unreviewed AI candidates
  - `onConfirm: () => void` - Confirm handler
  - `onCancel: () => void` - Cancel handler

## 5. Types

### CandidateCardViewModel

Represents a flashcard candidate in the review list with its review state.

```typescript
interface CandidateCardViewModel {
  id: string; // Temporary client-side ID (UUID)
  front: string;
  back: string;
  status: "unreviewed" | "accepted" | "edited" | "deleted";
  source: "ai_full" | "ai_edited" | "manual";
  originalFront?: string; // For tracking edits
  originalBack?: string; // For tracking edits
}
```

### CreateFlashcardsState

Main state object for the CreateFlashcardsContainer component.

```typescript
interface CreateFlashcardsState {
  sourceText: string;
  isGenerating: boolean;
  isSaving: boolean;
  candidates: CandidateCardViewModel[];
  generationMetadata: GenerationMetadataDto | null;
  initialAICandidatesCount: number;
  error: string | null;
  modalState: {
    isOpen: boolean;
    mode: "add" | "edit";
    editingId: string | null;
    initialData: FlashcardFormData | null;
  };
  confirmRegenerateModalOpen: boolean;
  confirmPartialSaveModalOpen: boolean;
}
```

### FlashcardFormData

Form data structure for the add/edit modal.

```typescript
interface FlashcardFormData {
  front: string;
  back: string;
}
```

### SourceTextInputProps

```typescript
interface SourceTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}
```

### CandidateReviewListProps

```typescript
interface CandidateReviewListProps {
  candidates: CandidateCardViewModel[];
  isLoading: boolean;
  error: string | null;
  onAccept: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### CandidateCardProps

```typescript
interface CandidateCardProps {
  candidate: CandidateCardViewModel;
  onAccept: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

### SaveAllButtonProps

```typescript
interface SaveAllButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  count: number;
}
```

### FlashcardAddEditModalProps

```typescript
interface FlashcardAddEditModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialData?: FlashcardFormData;
  onSave: (data: FlashcardFormData) => void;
  onCancel: () => void;
}
```

### ConfirmRegenerateModalProps

```typescript
interface ConfirmRegenerateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### ConfirmPartialSaveModalProps

```typescript
interface ConfirmPartialSaveModalProps {
  isOpen: boolean;
  unreviewedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}
```

## 6. State Management

State is managed locally within the `CreateFlashcardsContainer` React component using the `useState` hook. A custom hook `useCreateFlashcards` encapsulates all state logic and API interactions.

### useCreateFlashcards Hook

**Purpose**: Centralizes state management and business logic for the create flashcards workflow.

**State Variables**:

- `sourceText`: Current text in the input area
- `isGenerating`: Loading state during AI generation
- `isSaving`: Loading state during save operation
- `candidates`: Array of candidate cards with review status
- `generationMetadata`: Metadata from AI generation (for logging)
- `error`: Error message to display
- `modalState`: Modal visibility and configuration

**Methods**:

- `handleSourceTextChange(text: string)`: Updates source text
- `handleGenerate()`: Validates text and calls generate-candidates API
- `handleAccept(id: string)`: Marks candidate as accepted
- `handleEdit(id: string)`: Opens modal with candidate data
- `handleDelete(id: string)`: Removes candidate from list
- `handleOpenManualAdd()`: Opens modal in add mode
- `handleModalSave(data: FlashcardFormData)`: Adds new or updates existing candidate
- `handleModalCancel()`: Closes modal
- `handleSaveAll()`: Executes two-step save process
- `resetState()`: Clears all state after successful save

**Computed Values**:

- `isSourceTextValid`: Boolean indicating if text length is valid
- `savableCards`: Filtered array of cards with status "accepted" or "edited"
- `unreviewedAICandidatesCount`: Count of unreviewed AI candidates
- `canSave`: Boolean indicating if save button should be enabled

## 7. API Integration

### Generate Candidates

**Endpoint**: `POST /api/generations/generate-candidates`

**Request Type**: `GenerateCandidatesCommand`

```typescript
{
  source_text: string; // 1,000-10,000 characters
}
```

**Response Type**: `GenerateCandidatesResponseDto`

```typescript
{
  candidates: FlashcardCandidateDto[]; // Array of {front, back}
  metadata: GenerationMetadataDto; // {model_used, generation_duration_ms, source_text_length, source_text_hash}
}
```

**Implementation**:

```typescript
const response = await fetch("/api/generations/generate-candidates", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source_text: sourceText }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.details || "Generation failed");
}

const data: GenerateCandidatesResponseDto = await response.json();
```

**Error Handling**:

- 400: Display validation error message
- 502: Display "AI service unavailable" message
- 500: Display generic error message

### Save Generation Log

**Endpoint**: `POST /api/generations`

**Request Type**: `CreateGenerationCommand`

```typescript
{
  generation_log: {
    model: string | null;
    generation_duration: number | null;
    source_text_hash: string;
    source_text_length: number;
    generated_count: number;
    accepted_unedited_count: number;
    accepted_edited_count: number;
    deleted_count: number;
  }
}
```

**Response Type**: `CreateGenerationResponseDto`

```typescript
{
  id: number;
  model: string | null;
  generation_duration: number | null;
  source_text_hash: string;
  source_text_length: number;
  generated_count: number;
  accepted_unedited_count: number;
  accepted_edited_count: number;
  deleted_count: number;
  created_at: string;
}
```

### Save Flashcards

**Endpoint**: `POST /api/flashcards`

**Request Type**: `CreateFlashcardsCommand`

```typescript
{
  flashcards: Array<{
    front: string;
    back: string;
    source: "ai_full" | "ai_edited" | "manual";
    generation_id: number | null;
  }>;
}
```

**Response Type**: `CreateFlashcardsResponseDto`

```typescript
{
  flashcards: FlashcardDto[]; // Array of saved flashcards with IDs
}
```

**Two-Step Save Implementation**:

```typescript
// Step 1: Save generation log (only if AI candidates exist)
let generationId: number | null = null;
if (hasAICandidates) {
  const genResponse = await fetch("/api/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generation_log: computedLogData }),
  });
  const genData = await genResponse.json();
  generationId = genData.id;
}

// Step 2: Save flashcards
const flashcardsPayload = savableCards.map((card) => ({
  front: card.front,
  back: card.back,
  source: card.source,
  generation_id: card.source.startsWith("ai") ? generationId : null,
}));

await fetch("/api/flashcards", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ flashcards: flashcardsPayload }),
});
```

## 8. User Interactions

### Generate Flashcards (US-006)

1. User pastes text into the source text area
2. Character counter updates in real-time
3. If text is < 1,000 or > 10,000 chars, validation error displays and Generate button is disabled
4. User clicks "Generate" button
5. If unsaved AI candidates exist:
   - Confirmation modal appears with warning message
   - User can cancel or proceed
   - If user proceeds: AI candidates (and metadata) are cleared, manual cards are preserved
6. Button shows loading spinner, textarea is disabled
7. Skeleton loaders appear in the review list (manual cards remain visible below)
8. On success: New candidates populate the list in "unreviewed" state (greyed out)
9. On error: Error message displays with appropriate guidance

### Accept AI Candidate (US-007)

1. User clicks "Accept" button (checkmark icon) on a candidate card
2. Card status changes to "accepted"
3. Card visual state changes: full opacity + green checkmark appears
4. Card's `source` is set to "ai_full"

### Edit AI Candidate (US-008)

1. User clicks "Edit" button (pencil icon) on a candidate card
2. Modal opens in "Edit Mode" with card's front/back pre-filled
3. User modifies text in modal fields
4. User clicks "Save" in modal
5. Modal validates input (front ≤ 200 chars, back ≤ 500 chars)
6. On validation success: Card in list updates with new text
7. Card status changes to "edited"
8. Card visual state changes: full opacity + green checkmark appears
9. Card's `source` is set to "ai_edited"
10. Modal closes

### Delete AI Candidate (US-009)

1. User clicks "Delete" button (trash icon) on a candidate card
2. Card is immediately removed from the list (no confirmation needed)
3. Card status is set to "deleted" (tracked for metrics but not displayed)

### Save Reviewed Cards (US-010)

1. User reviews candidates (accepts, edits, or deletes some)
2. "Save Cards" button shows count of cards to save
3. User clicks "Save Cards" button
4. If unreviewed AI candidates exist:
   - Confirmation modal appears with count of unreviewed cards
   - User can cancel or proceed with "Discard & Save"
   - If user cancels: modal closes, state unchanged
5. Button shows loading spinner, all interactions are disabled
6. System executes two-step save:
   - If AI candidates exist: POST to `/api/generations` to log the generation event (unreviewed cards counted as deleted)
   - POST to `/api/flashcards` with all accepted/edited cards
7. On success: Success message displays, review list clears, source text clears
8. On error: Error message displays, state remains unchanged for retry

### Manual Card Creation (US-011)

1. User clicks "Add Manually" button
2. Modal opens in "Add Mode" with empty fields
3. User enters front text (max 200 chars) and back text (max 500 chars)
4. Character counters update in real-time
5. User clicks "Save" in modal
6. Modal validates input
7. On validation success: New card is added to the review list with status "accepted" and source "manual"
8. Card appears with full opacity + green checkmark
9. Modal closes
10. User can continue adding more cards or proceed to save

## 9. Conditions and Validation

### Source Text Validation

**Component**: `SourceTextInput`

**Conditions**:

- Minimum length: 1,000 characters
- Maximum length: 10,000 characters

**UI Effects**:

- Character counter turns red when invalid
- Error message displays below textarea
- Generate button is disabled when invalid
- Error messages:
  - "Text must be at least 1,000 characters" (when < 1,000)
  - "Text must not exceed 10,000 characters" (when > 10,000)

### Modal Form Validation

**Component**: `FlashcardAddEditModal`

**Conditions**:

- Front field: required, max 200 characters
- Back field: required, max 500 characters

**UI Effects**:

- Character counters turn red when exceeding limit
- Save button is disabled when:
  - Either field is empty
  - Either field exceeds character limit
- Error messages display below fields when invalid

### Save Button Validation

**Component**: `SaveAllButton`

**Conditions**:

- At least one card must have status "accepted" or "edited"
- Not currently in saving state

**UI Effects**:

- Button is disabled when no savable cards exist
- Button shows count: "Save Cards (3)"
- Button shows loading spinner during save operation
- All other interactions are disabled during save

### Generation Button Validation

**Component**: `SourceTextInput`

**Conditions**:

- Source text must be valid (1,000-10,000 chars)
- Not currently generating

**UI Effects**:

- Button is disabled when text is invalid
- Button shows loading spinner during generation
- Textarea is disabled during generation

## 10. Error Handling

### AI Generation Errors

**Scenario**: API call to `/api/generations/generate-candidates` fails

**Error Types**:

- **400 Bad Request**: Validation error (text length invalid)
  - Display: "Please ensure your text is between 1,000 and 10,000 characters."
- **502 Bad Gateway**: AI service unavailable
  - Display: "The AI service is currently unavailable. Please try again in a few moments."
- **500 Internal Server Error**: Unexpected error
  - Display: "An unexpected error occurred. Please try again."

**Handling**:

- Display error message in the `CandidateReviewList` area
- Keep source text intact for retry
- Re-enable Generate button
- Provide "Try Again" button in error message

### No Candidates Generated (US-023)

**Scenario**: AI returns 0 candidates (empty array)

**Handling**:

- Display message: "We couldn't find any factual items to create cards from. This tool works best with definitions and key terms. Please adjust the text and try again."
- Keep source text intact for editing
- Re-enable Generate button

### Save Operation Errors

**Scenario**: Either `/api/generations` or `/api/flashcards` fails during save

**Error Types**:

- **400 Bad Request**: Validation error in payload
  - Display: "Some cards have invalid data. Please review and try again."
- **401 Unauthorized**: Session expired
  - Display: "Your session has expired. Please log in again."
  - Redirect to login page after 3 seconds
- **500 Internal Server Error**: Database error
  - Display: "Failed to save cards. Please try again."

**Handling**:

- Display error message as toast/alert
- Keep all state intact (candidates, review status)
- Re-enable Save button for retry
- Log error details to console for debugging

### Network Errors

**Scenario**: Network request fails (no response)

**Handling**:

- Display: "Network error. Please check your connection and try again."
- Keep state intact for retry
- Re-enable relevant buttons

### Malformed AI Response

**Scenario**: AI returns data that doesn't match expected schema

**Handling**:

- Silently filter out malformed candidates
- Only display valid candidates with both `front` and `back` fields
- If all candidates are malformed, treat as "No Candidates Generated"
- Log malformed data to console for debugging

## 11. Implementation Steps

1. **Create the Astro page wrapper**
   - Create `src/pages/create-flashcards.astro`
   - Add route protection (check authentication)
   - Import and render `CreateFlashcardsContainer` with `client:load`

2. **Implement the custom hook**
   - Create `src/hooks/useCreateFlashcards.ts`
   - Implement all state variables using `useState`
   - Implement all handler methods
   - Implement computed values
   - Add proper TypeScript types

3. **Build the main container component**
   - Create `src/components/CreateFlashcardsContainer.tsx`
   - Use the `useCreateFlashcards` hook
   - Render all child components with proper props
   - Add layout and spacing

4. **Implement SourceTextInput component**
   - Create `src/components/SourceTextInput.tsx`
   - Add textarea with character counter
   - Implement validation logic and error display
   - Add Generate button with loading state
   - Style according to design system

5. **Implement ManualAddButton component**
   - Create `src/components/ManualAddButton.tsx`
   - Add button with icon
   - Connect to modal open handler

6. **Implement CandidateReviewList component**
   - Create `src/components/CandidateReviewList.tsx`
   - Add conditional rendering for loading/error/content states
   - Implement skeleton loader
   - Implement error message display
   - Map candidates to CandidateCard components

7. **Implement CandidateCard component**
   - Create `src/components/CandidateCard.tsx`
   - Implement FlashCard display (front/back flip)
   - Add action buttons (Accept, Edit, Delete)
   - Implement visual states (greyed out vs. full opacity)
   - Add green checkmark indicator for accepted/edited
   - Apply proper styling and accessibility

8. **Implement FlashcardAddEditModal component**
   - Create `src/components/FlashcardAddEditModal.tsx`
   - Build modal structure with overlay
   - Add form fields with character counters
   - Implement validation logic
   - Add Save and Cancel buttons
   - Handle keyboard interactions (Escape to close)
   - Ensure accessibility (focus trap, ARIA labels)

9. **Implement SaveAllButton component**
   - Create `src/components/SaveAllButton.tsx`
   - Add button with card count display
   - Implement disabled states
   - Add loading spinner

10. **Implement API integration functions**
    - Create `src/lib/api/flashcards.ts` with:
      - `generateCandidates(sourceText: string)`
      - `saveGenerationLog(logData: CreateGenerationLogDto)`
      - `saveFlashcards(flashcards: CreateFlashcardDto[])`
    - Add proper error handling and type safety

11. **Add utility functions**
    - Create `src/lib/utils/flashcard-helpers.ts` with:
      - `generateClientId()`: Creates UUID for temporary IDs
      - `computeGenerationMetrics(candidates: CandidateCardViewModel[])`: Calculates counts for generation log
      - `validateFlashcardForm(data: FlashcardFormData)`: Validates modal form

12. **Implement the two-step save flow**
    - In `useCreateFlashcards.handleSaveAll()`:
      - Check if AI candidates exist
      - If yes: call `saveGenerationLog()` first, get generation_id
      - Map savable cards to API format
      - Call `saveFlashcards()` with generation_id for AI cards
      - Handle success: show message, reset state
      - Handle errors: display message, keep state

13. **Add loading states and skeletons**
    - Create `src/components/SkeletonLoader.tsx`
    - Implement skeleton cards matching CandidateCard layout
    - Add loading spinners to buttons

14. **Implement error boundaries**
    - Add React error boundary around CreateFlashcardsContainer
    - Display fallback UI on component errors
    - Log errors for debugging

15. **Add accessibility features**
    - Ensure all interactive elements are keyboard-navigable
    - Add proper ARIA labels and roles
    - Implement focus management (modal focus trap)
    - Add screen reader announcements for state changes
    - Test with keyboard-only navigation

16. **Style components**
    - Apply Tailwind classes according to design system
    - Implement responsive design
    - Add hover/focus states
    - Ensure visual consistency with other views
