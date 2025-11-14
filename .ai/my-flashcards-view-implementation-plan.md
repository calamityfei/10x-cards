# View Implementation Plan: My Flashcards

## 1. Overview

The My Flashcards view is the central management hub for all user flashcards. It serves as the default landing page after login, displaying a paginated, searchable grid of flashcards. Users can flip cards to view both sides, edit existing cards, and delete unwanted cards. The view implements real-time search with debouncing, pagination controls, and handles empty states gracefully. All data operations are optimized with React Query for caching and automatic refetching.

## 2. View Routing

- **Path**: `/my-flashcards`
- **Access**: Protected (requires authentication)
- **Default Landing**: Yes (users are redirected here after successful login)

## 3. Component Structure

```
MyFlashcardsPage (Astro)
├── SearchInput (React)
├── FlashcardGrid (React)
│   └── FlashcardItem (React) [multiple instances]
│       ├── Card front/back display
│       ├── Edit button
│       └── Delete button
├── Pagination (React)
├── ReusableEmptyState (React)
├── FlashcardAddEditModal (React) [conditional]
└── ConfirmationModal (React) [conditional]
```

**Component Hierarchy**:

- `MyFlashcardsPage.astro` - Server-rendered page wrapper with auth check
- `MyFlashcardsView.tsx` - Main React component managing state and data fetching
  - `SearchInput.tsx` - Debounced search field
  - `FlashcardGrid.tsx` - Responsive grid container
    - `FlashcardItem.tsx` - Individual card with flip animation
  - `Pagination.tsx` - Navigation controls
  - `ReusableEmptyState.tsx` - Empty state message
  - `FlashcardAddEditModal.tsx` - Edit modal (reused from Create view)
  - `ConfirmationModal.tsx` - Delete confirmation

## 4. Component Details

### MyFlashcardsPage.astro

- **Description**: Server-rendered Astro page that handles authentication and renders the React view component.
- **Main elements**:
  - Auth check using `Astro.locals.user`
  - Redirect to `/auth/login` if not authenticated
  - Layout wrapper with navigation
  - Client-side React component hydration
- **Handled interactions**: None (server-side only)
- **Handled validation**: Authentication status check
- **Types**: None (uses Astro.locals)
- **Props**: None

### MyFlashcardsView.tsx

- **Description**: Main React component that orchestrates data fetching, state management, and renders all child components. Manages search, pagination, and modal states.
- **Main elements**:
  - Container div with max-width and padding
  - Page title (h1)
  - SearchInput component
  - Conditional rendering: loading skeleton, error message, empty state, or FlashcardGrid
  - Pagination component
  - FlashcardAddEditModal (conditional)
  - ConfirmationModal (conditional)
- **Handled interactions**:
  - Search query changes (debounced)
  - Page navigation
  - Edit button clicks (opens modal)
  - Delete button clicks (opens confirmation)
  - Modal save/cancel actions
- **Handled validation**: None (delegates to child components)
- **Types**:
  - `GetFlashcardsResponseDto` (API response)
  - `FlashcardDto` (individual card)
  - `GetFlashcardsQueryDto` (query parameters)
  - `FlashcardToEdit` (view model for edit state)
- **Props**: None (root component)

### SearchInput.tsx

- **Description**: Debounced text input for filtering flashcards by front or back text. Updates URL query parameters to maintain search state.
- **Main elements**:
  - Input field (type="text")
  - Search icon
  - Clear button (when text is present)
  - Label for accessibility
- **Handled interactions**:
  - Text input (debounced 300ms)
  - Clear button click
  - Enter key press
- **Handled validation**: None (search is optional)
- **Types**: None (uses primitive string)
- **Props**:
  ```typescript
  interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }
  ```

### FlashcardGrid.tsx

- **Description**: Responsive grid container that displays flashcard items. Handles loading states with skeleton loaders.
- **Main elements**:
  - Grid container (CSS Grid with responsive columns)
  - FlashcardItem components (mapped from data)
  - Skeleton loaders (during loading state)
- **Handled interactions**: None (delegates to children)
- **Handled validation**: None
- **Types**:
  - `FlashcardDto[]` (array of cards)
- **Props**:
  ```typescript
  interface FlashcardGridProps {
    flashcards: FlashcardDto[];
    isLoading: boolean;
    onEdit: (flashcard: FlashcardDto) => void;
    onDelete: (flashcard: FlashcardDto) => void;
  }
  ```

### FlashcardItem.tsx

- **Description**: Individual flashcard component with flip animation. Displays front text by default, flips to show back text on click. Includes edit and delete action buttons.
- **Main elements**:
  - Card container (clickable for flip)
  - Front face (shows `front` text)
  - Back face (shows `back` text)
  - Edit button (icon button)
  - Delete button (icon button)
  - Source badge (visual indicator: AI/Manual)
- **Handled interactions**:
  - Card click (toggles flip state)
  - Edit button click (prevents flip, calls onEdit)
  - Delete button click (prevents flip, calls onDelete)
- **Handled validation**: None
- **Types**:
  - `FlashcardDto` (card data)
- **Props**:
  ```typescript
  interface FlashcardItemProps {
    flashcard: FlashcardDto;
    onEdit: (flashcard: FlashcardDto) => void;
    onDelete: (flashcard: FlashcardDto) => void;
  }
  ```

### Pagination.tsx

- **Description**: Navigation controls for paginated flashcard list. Displays current page, total pages, and next/previous buttons.
- **Main elements**:
  - Previous button (disabled on first page)
  - Page indicator text ("Page X of Y")
  - Next button (disabled on last page)
  - Total count display
- **Handled interactions**:
  - Previous button click
  - Next button click
- **Handled validation**:
  - Disable previous button when `currentPage === 1`
  - Disable next button when `currentPage === totalPages`
- **Types**:
  - `PaginationDto` (pagination metadata)
- **Props**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
  }
  ```

### ReusableEmptyState.tsx

- **Description**: Displays a friendly message when the user has no flashcards. Includes a call-to-action button linking to the Create Flashcards page.
- **Main elements**:
  - Icon or illustration
  - Heading ("Your deck is empty!")
  - Description text
  - Link/button to `/create-flashcards`
- **Handled interactions**:
  - Button click (navigates to create page)
- **Handled validation**: None
- **Types**: None
- **Props**:
  ```typescript
  interface ReusableEmptyStateProps {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }
  ```

### FlashcardAddEditModal.tsx

- **Description**: Reusable modal for editing flashcard content. Pre-filled with existing card data in edit mode. Validates input lengths according to API constraints.
- **Main elements**:
  - Modal overlay
  - Modal dialog
  - Title ("Edit Flashcard")
  - Front text input (textarea, max 200 chars)
  - Back text input (textarea, max 500 chars)
  - Character count indicators
  - Save button
  - Cancel button
  - Error message display
- **Handled interactions**:
  - Text input changes
  - Save button click
  - Cancel button click
  - Escape key press (close)
  - Overlay click (close)
- **Handled validation**:
  - Front text: required, max 200 characters
  - Back text: required, max 500 characters
  - Disable save button if validation fails
- **Types**:
  - `FlashcardDto` (for edit mode)
  - `UpdateFlashcardCommand` (API request)
- **Props**:
  ```typescript
  interface FlashcardAddEditModalProps {
    isOpen: boolean;
    mode: "add" | "edit";
    flashcard?: FlashcardDto;
    onSave: (data: UpdateFlashcardCommand) => Promise<void>;
    onClose: () => void;
  }
  ```

### ConfirmationModal.tsx

- **Description**: Generic confirmation dialog for destructive actions. Used to confirm flashcard deletion.
- **Main elements**:
  - Modal overlay
  - Modal dialog
  - Title
  - Description text
  - Confirm button (destructive styling)
  - Cancel button
- **Handled interactions**:
  - Confirm button click
  - Cancel button click
  - Escape key press (cancel)
  - Overlay click (cancel)
- **Handled validation**: None
- **Types**: None
- **Props**:
  ```typescript
  interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: "danger" | "warning";
  }
  ```

## 5. Types

### Existing DTOs (from types.ts)

```typescript
// Already defined - use as-is
export type FlashcardDto = Omit<FlashcardRow, "user_id">;

export interface PaginationDto {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface GetFlashcardsResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

export interface GetFlashcardsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "created_at" | "updated_at" | "front";
  order?: "asc" | "desc";
}

export type UpdateFlashcardCommand = Pick<TablesUpdate<"flashcards">, "front" | "back">;
```

### New View Models (to be added)

```typescript
/**
 * View model for flashcard edit state.
 * Tracks which flashcard is being edited in the modal.
 */
export interface FlashcardToEdit {
  id: number;
  front: string;
  back: string;
}

/**
 * View model for search and pagination state.
 * Represents the current view state in URL query parameters.
 */
export interface FlashcardsViewState {
  page: number;
  search: string;
  sort: "created_at" | "updated_at" | "front";
  order: "asc" | "desc";
}

/**
 * View model for modal states.
 * Tracks which modal is open and associated data.
 */
export interface ModalState {
  editModal: {
    isOpen: boolean;
    flashcard: FlashcardDto | null;
  };
  deleteModal: {
    isOpen: boolean;
    flashcard: FlashcardDto | null;
  };
}
```

## 6. State Management

### Custom Hook: useFlashcards

Create a custom hook `useFlashcards` to encapsulate all data fetching and mutation logic:

```typescript
function useFlashcards(queryParams: GetFlashcardsQueryDto) {
  // React Query for fetching flashcards
  const flashcardsQuery = useQuery({
    queryKey: ["flashcards", queryParams],
    queryFn: () => fetchFlashcards(queryParams),
  });

  // Mutation for updating flashcard
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFlashcardCommand }) => updateFlashcard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
    },
  });

  // Mutation for deleting flashcard
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
```

### Local Component State

**MyFlashcardsView.tsx** manages:

- `searchQuery` (string) - Current search input value
- `currentPage` (number) - Current pagination page
- `modalState` (ModalState) - Tracks open modals and associated data

**FlashcardItem.tsx** manages:

- `isFlipped` (boolean) - Card flip state

**SearchInput.tsx** manages:

- `inputValue` (string) - Local input value (before debounce)

### URL State Synchronization

Use URL query parameters to persist view state:

- `?page=2` - Current page
- `?search=sql` - Search query
- `?sort=created_at&order=desc` - Sort configuration

This enables:

- Shareable URLs
- Browser back/forward navigation
- State persistence on page refresh

## 7. API Integration

### API Functions (to be added to src/lib/api/flashcards.ts)

```typescript
/**
 * Fetches paginated flashcards with optional search and sorting.
 * GET /api/flashcards
 */
export async function fetchFlashcards(params: GetFlashcardsQueryDto): Promise<GetFlashcardsResponseDto> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  const response = await fetch(`/api/flashcards?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch flashcards");
  }

  return response.json();
}

/**
 * Updates an existing flashcard.
 * PATCH /api/flashcards/:id
 */
export async function updateFlashcard(id: number, data: UpdateFlashcardCommand): Promise<FlashcardDto> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update flashcard");
  }

  return response.json();
}

/**
 * Deletes a flashcard permanently.
 * DELETE /api/flashcards/:id
 */
export async function deleteFlashcard(id: number): Promise<void> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete flashcard");
  }
}
```

### Request/Response Flow

1. **Initial Load**:
   - Request: `GET /api/flashcards?page=1&limit=50&sort=created_at&order=desc`
   - Response: `GetFlashcardsResponseDto` with data and pagination

2. **Search**:
   - Request: `GET /api/flashcards?page=1&limit=50&search=sql`
   - Response: Filtered `GetFlashcardsResponseDto`

3. **Update**:
   - Request: `PATCH /api/flashcards/123` with `UpdateFlashcardCommand` body
   - Response: Updated `FlashcardDto`
   - Side effect: Invalidate React Query cache, refetch list

4. **Delete**:
   - Request: `DELETE /api/flashcards/123`
   - Response: 204 No Content
   - Side effect: Invalidate React Query cache, refetch list

## 8. User Interactions

### Search Interaction (US-013)

1. User types in search input
2. Input value updates locally (immediate feedback)
3. After 300ms debounce, search query updates
4. URL updates with `?search=query`
5. React Query refetches with new search parameter
6. Grid updates with filtered results
7. Pagination resets to page 1

### Pagination Interaction (US-014)

1. User clicks "Next" or "Previous" button
2. Current page state updates
3. URL updates with `?page=X`
4. React Query refetches with new page parameter
5. Grid updates with new page of results
6. Scroll to top of page

### Card Flip Interaction (US-012)

1. User clicks on flashcard
2. Local `isFlipped` state toggles
3. CSS animation rotates card 180 degrees
4. Back text becomes visible
5. Click again to flip back

### Edit Interaction (US-015)

1. User clicks "Edit" button on flashcard
2. Click event stops propagation (prevents flip)
3. Modal state updates: `editModal.isOpen = true`, `editModal.flashcard = card`
4. FlashcardAddEditModal opens with pre-filled data
5. User modifies front/back text
6. User clicks "Save"
7. Validation runs (front ≤ 200 chars, back ≤ 500 chars)
8. If valid: API call to `PATCH /api/flashcards/:id`
9. On success: Modal closes, React Query invalidates cache, list refetches
10. Updated card appears in grid

### Delete Interaction (US-016)

1. User clicks "Delete" button on flashcard
2. Click event stops propagation (prevents flip)
3. Modal state updates: `deleteModal.isOpen = true`, `deleteModal.flashcard = card`
4. ConfirmationModal opens with warning message
5. User clicks "Confirm"
6. API call to `DELETE /api/flashcards/:id`
7. On success: Modal closes, React Query invalidates cache, list refetches
8. Card removed from grid
9. If this was the last card on the page and not page 1, navigate to previous page

### Empty State Interaction (US-020)

1. User has 0 flashcards
2. ReusableEmptyState component renders instead of grid
3. User clicks "Create Flashcards" button
4. Navigate to `/create-flashcards`

## 9. Conditions and Validation

### Component-Level Conditions

**MyFlashcardsView.tsx**:

- Show loading skeleton when `isLoading === true`
- Show error message when `isError === true`
- Show empty state when `flashcards.length === 0 && !isLoading && !isError`
- Show grid when `flashcards.length > 0`
- Show pagination when `totalPages > 1`

**SearchInput.tsx**:

- Show clear button when `value.length > 0`
- Debounce onChange by 300ms

**Pagination.tsx**:

- Disable "Previous" button when `currentPage === 1`
- Disable "Next" button when `currentPage === totalPages`
- Hide component when `totalPages <= 1`

**FlashcardAddEditModal.tsx**:

- Front text validation:
  - Required: `front.trim().length > 0`
  - Max length: `front.length <= 200`
- Back text validation:
  - Required: `back.trim().length > 0`
  - Max length: `back.length <= 500`
- Disable "Save" button when any validation fails
- Show character count: `${front.length}/200` and `${back.length}/500`
- Show error message when validation fails on submit

**FlashcardItem.tsx**:

- Truncate front text if longer than 100 characters (with ellipsis)
- Truncate back text if longer than 200 characters (with ellipsis)
- Show source badge based on `source` field value

### API-Level Validation (enforced by backend)

The API validates:

- `page`: Must be positive integer (default: 1)
- `limit`: Must be positive integer, max 100 (default: 50)
- `search`: Optional string
- `front`: Required, max 200 characters
- `back`: Required, max 500 characters

Frontend must handle API validation errors:

- 400 Bad Request: Show validation error message
- 401 Unauthorized: Redirect to login
- 404 Not Found: Show "Flashcard not found" message
- 500 Server Error: Show generic error message

## 10. Error Handling

### Network Errors

**Scenario**: API request fails due to network issues
**Handling**:

- React Query automatically retries (3 attempts)
- Show error toast notification
- Display error state in UI with retry button
- Log error to console for debugging

### Validation Errors (400)

**Scenario**: User submits invalid data (e.g., front text > 200 chars)
**Handling**:

- Display inline error message in modal
- Highlight invalid field with red border
- Keep modal open for correction
- Disable submit button until valid

### Authentication Errors (401)

**Scenario**: User session expires during operation
**Handling**:

- Clear local auth state
- Redirect to `/auth/login`
- Show toast: "Session expired. Please log in again."
- Preserve intended action in URL for post-login redirect

### Not Found Errors (404)

**Scenario**: User tries to edit/delete a flashcard that no longer exists
**Handling**:

- Show toast: "Flashcard not found. It may have been deleted."
- Close modal
- Refetch flashcard list to sync state

### Concurrent Modification

**Scenario**: User edits a card that was modified by another session
**Handling**:

- API returns 409 Conflict (if implemented)
- Show warning: "This flashcard was modified. Please refresh and try again."
- Offer "Refresh" button to reload data

### Empty Search Results

**Scenario**: Search query returns 0 results
**Handling**:

- Show message: "No flashcards match your search."
- Display current search query
- Offer "Clear search" button
- Do NOT show empty state (user has cards, just filtered out)

### Pagination Edge Cases

**Scenario**: User deletes last card on a page (not page 1)
**Handling**:

- After successful delete, check if `flashcards.length === 0`
- If true and `currentPage > 1`, navigate to `currentPage - 1`
- Refetch data for new page

### Modal Errors

**Scenario**: Error occurs during save/delete operation
**Handling**:

- Keep modal open
- Display error message at top of modal
- Allow user to retry or cancel
- Log error details to console

## 11. Implementation Steps

### Step 1: Create API Functions

- Add `fetchFlashcards`, `updateFlashcard`, and `deleteFlashcard` to `src/lib/api/flashcards.ts`
- Add new view model types to `src/types.ts`

### Step 2: Create Custom Hook

- Create `src/hooks/useFlashcards.ts`
- Implement React Query integration
- Handle mutations with cache invalidation

### Step 3: Create Base Components

- Create `src/components/SearchInput.tsx` with debounce logic
- Create `src/components/Pagination.tsx` with navigation controls
- Create `src/components/ReusableEmptyState.tsx` for empty states

### Step 4: Create Flashcard Components

- Create `src/components/FlashcardItem.tsx` with flip animation
- Create `src/components/FlashcardGrid.tsx` as container
- Implement responsive grid layout with Tailwind

### Step 5: Create Modal Components

- Create `src/components/FlashcardAddEditModal.tsx` (or reuse from Create view)
- Create `src/components/ConfirmationModal.tsx`
- Implement validation logic and error handling

### Step 6: Create Main View Component

- Create `src/components/MyFlashcardsView.tsx`
- Integrate useFlashcards hook
- Implement search and pagination state management
- Wire up all child components

### Step 7: Create Astro Page

- Create `src/pages/my-flashcards.astro`
- Add authentication check
- Hydrate MyFlashcardsView component with `client:load`

### Step 8: Implement URL State Sync

- Add URL query parameter reading on mount
- Update URL when search/page changes
- Handle browser back/forward navigation

### Step 9: Add Loading States

- Create skeleton loader components
- Implement loading states in grid
- Add loading indicators to buttons during mutations

### Step 10: Add Error Handling

- Implement error boundaries
- Add toast notifications for errors
- Handle all error scenarios from section 10

### Step 11: Add Accessibility

- Add ARIA labels to all interactive elements
- Implement keyboard navigation for modals
- Add focus management (trap focus in modals)
- Test with screen reader

### Step 12: Testing and Polish

- Test all user interactions
- Verify pagination edge cases
- Test search with various queries
- Verify responsive design on mobile
- Test error scenarios
- Optimize performance (memoization, lazy loading)
