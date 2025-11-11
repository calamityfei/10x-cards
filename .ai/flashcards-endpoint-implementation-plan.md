# API Endpoint Implementation Plan: Flashcards Resource

## 1. Endpoint Overview

The Flashcards Resource provides a complete CRUD interface for managing user flashcards. It consists of five endpoints that enable users to:
- Retrieve a paginated, searchable list of their flashcards
- Create flashcards in batches (from AI generation or manual input)
- Retrieve individual flashcard details
- Update flashcard content (front/back text only)
- Permanently delete flashcards

All endpoints require authentication via JWT and enforce user-level data isolation through Supabase Row-Level Security (RLS) policies.

---

## 2. Request Details

### 2.1 GET /flashcards

- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required (JWT)
- **Query Parameters**:
  - `page` (number, optional, default: 1): Page number for pagination
  - `limit` (number, optional, default: 50): Items per page
  - `search` (string, optional): Search term for filtering front/back fields
  - `sort` (string, optional, default: "created_at"): Field to sort by (created_at, updated_at, front)
  - `order` (string, optional, default: "desc"): Sort order (asc or desc)

### 2.2 POST /flashcards

- **HTTP Method**: POST
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required (JWT)
- **Request Body**:
```json
{
  "flashcards": [
    {
      "front": "string (max 200 chars, required)",
      "back": "string (max 500 chars, required)",
      "source": "manual | ai_full | ai_edited (required)",
      "generation_id": "number | null (optional)"
    }
  ]
}
```

### 2.3 GET /flashcards/:id

- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards/:id`
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (number, required): Flashcard ID

### 2.4 PATCH /flashcards/:id

- **HTTP Method**: PATCH
- **URL Structure**: `/api/flashcards/:id`
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (number, required): Flashcard ID
- **Request Body**:
```json
{
  "front": "string (max 200 chars, optional)",
  "back": "string (max 500 chars, optional)"
}
```
Note: At least one field (front or back) must be provided.

### 2.5 DELETE /flashcards/:id

- **HTTP Method**: DELETE
- **URL Structure**: `/api/flashcards/:id`
- **Authentication**: Required (JWT)
- **Path Parameters**:
  - `id` (number, required): Flashcard ID

---

## 3. Used Types

All types are defined in `src/types.ts`:

### DTOs (Data Transfer Objects)
- `FlashcardDto`: Flashcard object returned to client (omits user_id)
- `PaginationDto`: Pagination metadata
- `GetFlashcardsResponseDto`: Response for GET /flashcards
- `CreateFlashcardsResponseDto`: Response for POST /flashcards

### Command Models
- `GetFlashcardsQueryDto`: Query parameters for GET /flashcards
- `CreateFlashcardDto`: Single flashcard in batch creation
- `CreateFlashcardsCommand`: Request body for POST /flashcards
- `UpdateFlashcardCommand`: Request body for PATCH /flashcards/:id

### Enums
- `CardSource`: "manual" | "ai_full" | "ai_edited"

---

## 4. Response Details

### 4.1 GET /flashcards

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
      "updated_at": "2025-11-10T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 250
  }
}
```

### 4.2 POST /flashcards

**Success (201 Created)**:
```json
{
  "flashcards": [
    {
      "id": 1,
      "front": "What is a REST API?",
      "back": "A style of architecture for networked applications.",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-11-10T10:05:00Z",
      "updated_at": "2025-11-10T10:05:00Z"
    }
  ]
}
```

### 4.3 GET /flashcards/:id

**Success (200 OK)**:
```json
{
  "id": 1,
  "front": "What is SQL?",
  "back": "A query language for relational databases.",
  "source": "manual",
  "generation_id": null,
  "created_at": "2025-11-10T10:00:00Z",
  "updated_at": "2025-11-10T10:00:00Z"
}
```

### 4.4 PATCH /flashcards/:id

**Success (200 OK)**:
Returns the updated flashcard object (same structure as GET /flashcards/:id).

### 4.5 DELETE /flashcards/:id

**Success (204 No Content)**:
No response body.

---

## 5. Data Flow

### 5.1 GET /flashcards
1. Astro API route receives request
2. Extract and validate query parameters using Zod
3. Verify user authentication via JWT (from context.locals.supabase)
4. Call flashcard service with validated parameters and user_id
5. Service builds Supabase query with:
   - RLS automatically filters by user_id
   - Search filter (ILIKE on front/back if provided)
   - Sort and order
   - Pagination (range)
6. Execute count query for total records
7. Calculate pagination metadata
8. Return formatted response

### 5.2 POST /flashcards
1. Astro API route receives request
2. Validate request body using Zod
3. Verify user authentication
4. Call flashcard service with validated flashcards array and user_id
5. Service inserts flashcards in batch (Supabase handles RLS)
6. Return created flashcards with generated IDs and timestamps

### 5.3 GET /flashcards/:id
1. Astro API route receives request
2. Validate id parameter
3. Verify user authentication
4. Call flashcard service with id and user_id
5. Service queries single flashcard (RLS ensures ownership)
6. Return 404 if not found, otherwise return flashcard

### 5.4 PATCH /flashcards/:id
1. Astro API route receives request
2. Validate id parameter and request body
3. Verify user authentication
4. Call flashcard service with id, updates, and user_id
5. Service updates flashcard (RLS ensures ownership, trigger updates updated_at)
6. Return 404 if not found, otherwise return updated flashcard

### 5.5 DELETE /flashcards/:id
1. Astro API route receives request
2. Validate id parameter
3. Verify user authentication
4. Call flashcard service with id and user_id
5. Service deletes flashcard (RLS ensures ownership)
6. Return 404 if not found, otherwise return 204

---

## 6. Security Considerations

### Authentication
- All endpoints require valid JWT token
- Use `context.locals.supabase.auth.getUser()` to verify authentication
- Return 401 if token is missing or invalid

### Authorization
- Supabase RLS policies automatically enforce user-level isolation
- Users can only access their own flashcards
- No need for manual user_id checks in application code

### Input Validation
- Validate all inputs using Zod schemas before processing
- Enforce character limits: front (200), back (500)
- Validate enum values for source field
- Sanitize search queries to prevent injection (Supabase client handles this)

### Data Exposure
- Never return user_id in responses (use FlashcardDto type)
- Return generic 404 for non-existent or unauthorized resources (don't reveal existence)

### Rate Limiting
- Consider implementing rate limiting for batch creation endpoint
- Limit maximum flashcards per batch (e.g., 50 cards)

---

## 7. Error Handling

### 400 Bad Request
- Invalid query parameters (non-numeric page/limit, invalid sort field)
- Validation failures (missing required fields, exceeding character limits)
- Malformed JSON in request body
- Empty flashcards array in POST request
- No fields provided in PATCH request

**Response Format**:
```json
{
  "error": "Validation failed",
  "details": ["front must be at most 200 characters"]
}
```

### 401 Unauthorized
- Missing JWT token
- Invalid or expired JWT token
- User not authenticated

**Response Format**:
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
- Flashcard with specified ID doesn't exist
- Flashcard exists but belongs to different user (don't reveal this)

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
- Log errors to console with context (user_id, endpoint, timestamp)
- Return user-friendly error messages (don't expose internal details)
- Use early returns for error conditions
- Implement guard clauses for preconditions

---

## 8. Performance Considerations

### Database Queries
- Use indexes on user_id for fast filtering (already defined in schema)
- Batch insert for POST /flashcards reduces round trips
- Use Supabase's range() for efficient pagination
- Search with ILIKE '%term%' won't use indexes (accepted trade-off for MVP)

### Pagination
- Default limit of 50 prevents large result sets
- Consider max limit (e.g., 100) to prevent abuse
- Use count query only when needed for pagination metadata

### Caching
- Not required for MVP (data changes frequently)
- Consider caching total count for large datasets in future

### N+1 Queries
- Not applicable (single table queries, no joins needed)

### Optimization Strategies
- Use select() to fetch only needed columns
- Avoid fetching user_id in queries (not needed in response)
- Use single() for GET by ID to ensure single result

---

## 9. Implementation Steps

### Step 1: Create Zod Validation Schemas
**File**: `src/lib/validation/flashcard.schemas.ts`

Create validation schemas for:
- Query parameters (GET /flashcards)
- Batch creation request (POST /flashcards)
- Update request (PATCH /flashcards/:id)
- Path parameter validation (id)

### Step 2: Create Flashcard Service
**File**: `src/lib/services/flashcard.service.ts`

Implement service functions:
- `getFlashcards(supabase, userId, query)`: Fetch paginated list with search/sort
- `createFlashcards(supabase, userId, flashcards)`: Batch insert flashcards
- `getFlashcardById(supabase, userId, id)`: Fetch single flashcard
- `updateFlashcard(supabase, userId, id, updates)`: Update flashcard
- `deleteFlashcard(supabase, userId, id)`: Delete flashcard

Each function should:
- Accept SupabaseClient from context.locals
- Use RLS for automatic user filtering
- Handle Supabase errors
- Return typed results

### Step 3: Create GET /flashcards Endpoint
**File**: `src/pages/api/flashcards/index.ts`

- Export `prerender = false`
- Implement GET handler
- Validate query parameters
- Verify authentication
- Call service function
- Return formatted response with pagination

### Step 4: Create POST /flashcards Endpoint
**File**: `src/pages/api/flashcards/index.ts` (same file)

- Implement POST handler
- Validate request body
- Verify authentication
- Call service function
- Return 201 with created flashcards

### Step 5: Create GET /flashcards/:id Endpoint
**File**: `src/pages/api/flashcards/[id].ts`

- Export `prerender = false`
- Implement GET handler
- Validate id parameter
- Verify authentication
- Call service function
- Return 404 if not found, otherwise return flashcard

### Step 6: Create PATCH /flashcards/:id Endpoint
**File**: `src/pages/api/flashcards/[id].ts` (same file)

- Implement PATCH handler
- Validate id parameter and request body
- Verify authentication
- Call service function
- Return 404 if not found, otherwise return updated flashcard

### Step 7: Create DELETE /flashcards/:id Endpoint
**File**: `src/pages/api/flashcards/[id].ts` (same file)

- Implement DELETE handler
- Validate id parameter
- Verify authentication
- Call service function
- Return 404 if not found, otherwise return 204

### Step 8: Error Handling Utilities
**File**: `src/lib/utils/api-errors.ts`

Create helper functions:
- `handleApiError(error)`: Format errors consistently
- `createErrorResponse(status, message, details?)`: Build error responses
- `isSupabaseError(error)`: Type guard for Supabase errors

### Step 9: Testing
- Test each endpoint with valid inputs
- Test authentication failures (missing/invalid JWT)
- Test validation failures (invalid inputs)
- Test authorization (accessing other user's flashcards)
- Test edge cases (empty search, large page numbers, etc.)
- Test batch creation with multiple flashcards
- Verify RLS policies work correctly

### Step 10: Documentation
- Update API documentation with examples
- Document error responses
- Add JSDoc comments to service functions
- Update types.ts if needed
