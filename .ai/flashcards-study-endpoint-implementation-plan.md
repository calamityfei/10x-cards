# API Endpoint Implementation Plan: Study Session Endpoints

## 1. Endpoint Overview

The Study Session endpoints extend the Flashcards Resource to support spaced repetition learning. They consist of two endpoints:

- **GET /flashcards/due**: Retrieves all flashcards currently due for review based on the FSRS algorithm
- **PATCH /flashcards/:id/review**: Updates a flashcard's SRS metadata after the user grades it with "Forgot" or "Knew"

Both endpoints require authentication via JWT and enforce user-level data isolation through Supabase RLS policies. The FSRS algorithm calculations are performed client-side using the ts-fsrs library, with the server responsible only for persisting the calculated state.

---

## 2. Request Details

### 2.1 GET /flashcards/due

- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards/due`
- **Authentication**: Required (JWT)
- **Query Parameters**: None
- **Request Body**: None

### 2.2 PATCH /flashcards/:id/review

- **HTTP Method**: PATCH
- **URL Structure**: `/api/flashcards/:id/review`
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (number, required): Flashcard ID
- **Request Body**:

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

---

## 3. Used Types

All types are defined in `src/types.ts`:

### DTOs (Data Transfer Objects)

- `FlashcardWithSrsDto`: Flashcard with SRS metadata
- `GetDueFlashcardsResponseDto`: Response for GET /flashcards/due
- `ReviewFlashcardResponseDto`: Response for PATCH review

### Command Models

- `ReviewFlashcardCommand`: Request body for PATCH review

### Enums

- `SrsState`: "New" | "Learning" | "Review" | "Relearning"

---

## 4. Response Details

### 4.1 GET /flashcards/due

**Success (200 OK)**:

```json
{
  "data": [
    {
      "id": 1,
      "front": "What is SQL?",
      "back": "A query language for relational databases.",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-11-10T10:00:00Z",
      "updated_at": "2025-11-10T10:00:00Z",
      "srs_state": "Review",
      "srs_due": "2025-01-15T10:00:00Z",
      "srs_stability": 5.2,
      "srs_difficulty": 6.1,
      "srs_reps": 3,
      "srs_lapses": 1,
      "last_reviewed": "2025-01-10T10:00:00Z"
    }
  ],
  "count": 15
}
```

### 4.2 PATCH /flashcards/:id/review

**Success (200 OK)**:

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

---

## 5. Data Flow

### 5.1 GET /flashcards/due

1. Astro API route receives request
2. Verify user authentication via JWT
3. Call flashcard service `getDueFlashcards(supabase, userId)`
4. Service builds Supabase query:
   - RLS automatically filters by user_id
   - Filter: `srs_due <= now()`
   - Order: `srs_due ASC`
   - Select all fields including SRS metadata
5. Return formatted response with count

### 5.2 PATCH /flashcards/:id/review

1. Astro API route receives request
2. Validate id parameter and request body using Zod
3. Verify user authentication
4. Call flashcard service `reviewFlashcard(supabase, userId, id, reviewData)`
5. Service updates flashcard:
   - RLS ensures ownership
   - Update all SRS fields from request
   - Set `last_reviewed = now()` server-side
   - Trigger updates `updated_at` automatically
6. Return 404 if not found, otherwise return updated flashcard (minimal fields)

---

## 6. Security Considerations

### Authentication

- Both endpoints require valid JWT token
- Use `context.locals.supabase.auth.getUser()` to verify authentication
- Return 401 if token is missing or invalid

### Authorization

- Supabase RLS policies automatically enforce user-level isolation
- Users can only access their own flashcards
- No manual user_id checks needed in application code

### Input Validation

- **PATCH /flashcards/:id/review**:
  - Validate `rating` is 1-4 (FSRS scale)
  - Validate `srs_state` is valid enum value
  - Validate `srs_due` is valid ISO timestamp
  - Validate numeric fields are non-negative
  - Validate `srs_stability` and `srs_difficulty` are positive numbers

### Data Integrity

- Server sets `last_reviewed = now()` to prevent client manipulation
- All other SRS fields are calculated client-side by ts-fsrs library
- Database constraints enforce valid ranges for counter fields

### Data Exposure

- Never return `user_id` in responses
- Return generic 404 for non-existent or unauthorized resources

---

## 7. Error Handling

### 400 Bad Request

- Invalid id parameter (non-numeric, negative)
- Validation failures in PATCH request:
  - Invalid rating (not 1-4)
  - Invalid srs_state (not in enum)
  - Invalid timestamp format
  - Negative values for counter fields
- Malformed JSON in request body

**Response Format**:

```json
{
  "error": "Validation failed",
  "details": ["rating must be between 1 and 4"]
}
```

### 401 Unauthorized

- Missing JWT token
- Invalid or expired JWT token

**Response Format**:

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

- Flashcard with specified ID doesn't exist
- Flashcard exists but belongs to different user

**Response Format**:

```json
{
  "error": "Flashcard not found"
}
```

### 500 Internal Server Error

- Database connection failures
- Unexpected Supabase errors
- Unhandled exceptions

**Response Format**:

```json
{
  "error": "Internal server error"
}
```

**Error Handling Strategy**:

- Use try-catch blocks in API routes
- Log errors with context (user_id, endpoint, timestamp)
- Return user-friendly messages (don't expose internals)
- Use early returns for error conditions
- Implement guard clauses for preconditions

---

## 8. Performance Considerations

### Database Queries

- **GET /flashcards/due**: Uses composite index `idx_flashcards_due (user_id, srs_due)` for fast filtering
- **PATCH /flashcards/:id/review**: Single row update by primary key (fast)
- No pagination needed for due cards (typically < 100 cards)

### Optimization Strategies

- Select only needed columns in responses
- Use `single()` for PATCH to ensure single result
- Avoid fetching `user_id` (not needed in response)

### Expected Load

- GET /flashcards/due: Called once per study session start
- PATCH /flashcards/:id/review: Called once per card reviewed
- Typical session: 5-50 cards, so 5-50 PATCH requests

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schemas

**File**: `src/lib/validation/flashcard.schemas.ts` (extend existing)

Add validation schemas for:

- `reviewFlashcardSchema`: Validate PATCH /flashcards/:id/review request body
  - `rating`: z.number().int().min(1).max(4)
  - `srs_state`: z.enum(['New', 'Learning', 'Review', 'Relearning'])
  - `srs_due`: z.string().datetime()
  - `srs_stability`: z.number().positive()
  - `srs_difficulty`: z.number().positive()
  - `srs_elapsed_days`: z.number().int().nonnegative()
  - `srs_scheduled_days`: z.number().int().nonnegative()
  - `srs_reps`: z.number().int().nonnegative()
  - `srs_lapses`: z.number().int().nonnegative()

### Step 2: Extend Flashcard Service

**File**: `src/lib/services/flashcard.service.ts` (extend existing)

Add service functions:

**`getDueFlashcards(supabase, userId)`**:

- Query: `SELECT * FROM flashcards WHERE user_id = $1 AND srs_due <= now() ORDER BY srs_due ASC`
- Return: `{ data: FlashcardWithSrsDto[], count: number }`
- Handle Supabase errors

**`reviewFlashcard(supabase, userId, id, reviewData)`**:

- Update query: Set all SRS fields from reviewData
- Set `last_reviewed = now()` server-side
- Return: Updated flashcard (id, front, back, srs_state, srs_due, last_reviewed)
- Handle not found (return null)
- Handle Supabase errors

### Step 3: Create GET /flashcards/due Endpoint

**File**: `src/pages/api/flashcards/due.ts`

- Export `prerender = false`
- Implement GET handler:
  1. Verify authentication
  2. Extract user_id from JWT
  3. Call `getDueFlashcards(supabase, userId)`
  4. Return 200 with data and count
  5. Handle errors (401, 500)

### Step 4: Create PATCH /flashcards/:id/review Endpoint

**File**: `src/pages/api/flashcards/[id]/review.ts`

- Export `prerender = false`
- Implement PATCH handler:
  1. Validate id parameter
  2. Validate request body with Zod
  3. Verify authentication
  4. Extract user_id from JWT
  5. Call `reviewFlashcard(supabase, userId, id, reviewData)`
  6. Return 404 if not found
  7. Return 200 with updated flashcard
  8. Handle errors (400, 401, 404, 500)

### Step 5: Testing

- Test GET /flashcards/due with no due cards
- Test GET /flashcards/due with multiple due cards
- Test GET /flashcards/due returns cards in correct order (oldest due first)
- Test PATCH review with valid data
- Test PATCH review with invalid rating (< 1, > 4)
- Test PATCH review with invalid srs_state
- Test PATCH review with negative counter values
- Test PATCH review with invalid timestamp
- Test authentication failures (missing/invalid JWT)
- Test authorization (accessing other user's cards)
- Verify `last_reviewed` is set server-side
- Verify RLS policies work correctly

### Step 6: Documentation

- Update API documentation with examples
- Document FSRS rating scale (1 = Forgot, 3 = Knew)
- Add JSDoc comments to service functions
- Document that SRS calculations happen client-side
