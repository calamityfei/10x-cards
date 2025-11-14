# REST API Plan

## 1. Resources

- **Flashcards**: `public.flashcards`
  - Represents a single flashcard (front/back) belonging to a user.
- **Generations**: `public.generations`
  - Represents a log of a single batch flashcard creation (both AI generated and manual), including the metrics and text used.
- **User**: `auth.users` (Handled by Supabase)
  - Represents the authenticated user. Endpoints are for managing the user's own profile and data.

## 2. Endpoints

---

### Flashcard Resource

#### GET /flashcards

- **Description**: Retrieves a paginated list of the authenticated user's flashcards, with optional search.
- **Query Parameters**:
  - `page` (number, optional, default: 1): The page number to retrieve.
  - `limit` (number, optional, default: 50): The number of items per page (as per PRD 3.4).
  - `search` (string, optional): A search term to filter by. The API will perform an `ILIKE '%search%'` query on both the `front` and `back` fields.
  - `sort` (string, optional, default: `created_at`): A field to be sorted by (ie. `created_at`).
  - `order` (`asc` | `desc`, optional, default: `desc`):
- **Response Payload (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "front": "What is SQL?",
        "back": "A query language for relational databases.",
        "source": "manual",
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
- **Error Codes**:
  - `400 Bad Request`: Invalid query parameters (e.g., `limit` is not a number).
  - `401 Unauthorized`: No valid JWT provided.

#### POST /flashcards

- **Description**: Creates a batch of flashcards (one or more, AI generated or manually) (US-011).
- **Request Payload**:
  ```json
  {
    "flashcards": [
      {
        "front": "What is a REST API?",
        "back": "A style of architecture for networked applications.",
        "source": "manual",
        "generation_id": null
      },
      {
        "front": "What does the POST command?",
        "back": "Create a new entry in the databse.",
        "source": "ai_full",
        "generation_id": 123
      }
    ]
  }
  ```
- **Response Payload (201 Created)**:
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
      },
      {
        "id": 2,
        "front": "What does the POST command?",
        "back": "Create a new entry in the databse.",
        "source": "ai_full",
        "generation_id": 123,
        "created_at": "2025-11-10T10:05:00Z",
        "updated_at": "2025-11-10T10:05:00Z"
      }
    ]
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Validation failed (e.g., `front` is missing or > 200 chars, `back` > 500 chars).
  - `401 Unauthorized`: No valid JWT provided.

#### GET /flashcards/:id

- **Description**: Retrieves a single flashcard by its ID.
- **Response Payload (200 OK)**:
  ```json
  {
    "id": 1,
    "front": "What is SQL?",
    "back": "A query language for relational databases.",
    "source": "manual",
    "created_at": "2025-11-10T10:00:00Z",
    "updated_at": "2025-11-10T10:00:00Z"
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: No valid JWT provided.
  - `404 Not Found`: No flashcard found with this ID, or it does not belong to the user.

#### PATCH /flashcards/:id

- **Description**: Updates the `front` or `back` text of an existing flashcard (US-015). The `source` cannot be changed.
- **Request Payload**:
  ```json
  {
    "front": "What is PostgreSQL?",
    "back": "An open-source object-relational database system."
  }
  ```
- **Response Payload (200 OK)**:
  - Returns the updated flashcard object (see `GET /flashcards/:id` response).
- **Error Codes**:
  - `400 Bad Request`: Validation failed (e.g., `front` > 200 chars).
  - `401 Unauthorized`: No valid JWT provided.
  - `404 Not Found`: No flashcard found with this ID, or it does not belong to the user.

#### DELETE /flashcards/:id

- **Description**: Permanently deletes a single flashcard (US-016).
- **Response Payload (204 No Content)**:
  - No content returned.
- **Error Codes**:
  - `401 Unauthorized`: No valid JWT provided.
  - `404 Not Found`: No flashcard found with this ID, or it does not belong to the user.

---

### Generation Resource

#### POST /generations/generate-candidates

- **Description**: (RPC Endpoint) Takes source text, calls the external AI service, and returns a list of _non-persistent_ flashcard candidates for user review (US-006). This endpoint **does not** save anything to the database.
- **Request Payload**:
  ```json
  {
    "source_text": "The mitochondria is the powerhouse of the cell..."
  }
  ```
- **Response Payload (200 OK)**:
  ```json
  {
    "candidates": [
      { "front": "What is the mitochondria?", "back": "The powerhouse of the cell." },
      { "front": "What is the function of the cell?", "back": "..." }
    ],
    "metadata": {
      "model_used": "anthropic/claude-3-haiku",
      "generation_duration_ms": 1450,
      "source_text_length": 1200,
      "source_text_hash": "a1b2c3d4e5f6..."
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Validation failed (e.g., `source_text` length not between 1,000 and 10,000 chars).
  - `401 Unauthorized`: No valid JWT provided.
  - `502 Bad Gateway`: The external AI service (Openrouter.ai) failed or timed out.

#### POST /generations

- **Description**: (Transactional Endpoint) Saves a batch of flashcards and logs the single generation event that created them (US-010). This is called _after_ the user reviews candidates from the endpoint above. The `deleted_count` includes both explicitly deleted cards and unreviewed cards that were discarded during partial save.
- **Request Payload**:
  ```json
  {
    "generation_log": {
      "model": "anthropic/claude-3-haiku",
      "generation_duration": 1450,
      "source_text_hash": "a1b2c3...",
      "source_text_length": 1200,
      "generated_count": 10,
      "accepted_unedited_count": 8,
      "accepted_edited_count": 1,
      "deleted_count": 1
    }
  }
  ```
- **Response Payload (201 Created)**:
  - Returns the newly created `generations` log object, populated with the new `generation_id`. Immediately after we call the `flashcards` POST endpoint to save newly created flashcards under new `generation_id` (for AI ones).
- **Error Codes**:
  - `400 Bad Request`: Validation failed (e.g., `generation_log` data is invalid).
  - `401 Unauthorized`: No valid JWT provided.

---

### User Resource

#### DELETE /user/me

- **Description**: Deletes the authenticated user's account and all associated data (US-005). This triggers the `ON DELETE CASCADE` in the database.
- **Response Payload (204 No Content)**:
  - No content returned.
- **Error Codes**:
  - `401 Unauthorized`: No valid JWT provided.

## 3. Authentication and Authorization

- **Authentication**: Handled by **Supabase Auth**. All endpoints listed above (except for Supabase's built-in auth endpoints like signup/login) require a valid **JWT** passed in the `Authorization: Bearer <token>` header.
- **Authorization**: Handled by **PostgreSQL Row-Level Security (RLS)**, as defined in the database plan. Supabase's API gateway (PostgREST) will automatically enforce these policies using the `auth.uid()` from the provided JWT. This ensures users can _only_ read, update, or delete their _own_ data.

## 4. Validation and Business Logic

### API-Level Validation

The API will validate all incoming request payloads _before_ sending them to the database.

- **POST /flashcards** & **PATCH /flashcards/:id**:
  - `front`: `required`, `string`, `max:200`
  - `back`: `required`, `string`, `max:500`
  - `source`: (On POST) `required`, disallowed on PATCH

- **POST /generations/generate-candidates**:
  - `source_text`: `required`, `string`, `min:1000`, `max:10000`

- **POST /generations**:
  - `generation_log.source_text_length`: `required`, `integer`, `min:1000`, `max:10000`
  - `generation_log.generation_duration`: `integer`, `min:1`
  - `generation_log.*_count`: `integer`, `min:0`

### Business Logic Implementation

- **AI Generation (US-006)**: Implemented in the `POST /generations/generate-candidates` endpoint. This endpoint is an "RPC-style" call that orchestrates:
  1.  Receiving text from the client.
  2.  Calling the external Openrouter.ai service.
  3.  Formatting the AI's response into a `candidates` array.
  4.  Returning the transient (non-DB) data to the client for review.

- **AI Generation log save (US-010)**: Implemented in the `POST /generates` endpoint. This is a transactional endpoint that:
  1.  Receives the generation log _summary_.
  2.  Starts a database transaction.
  3.  Inserts a single row into the `public.generations` table.
  4.  Retrieves the new `generation_id` from that row.
  5.  Calls the `Batch Save` bussiness logic endpoint `POST /flashcards`, passing an array of reviewed flashcard candidates (with newly retrieved `generation_id` added to all AI generated candidates).
  6.  Performs a batch `INSERT` into the `public.flashcards` table.
  7.  Commits the transaction.

- **Batch Save (US-010)**: Implemented in the `POST /flashcards` endpoint. Allows to save an array of all (AI generated and manual) newly added and reviewed flashcard candidates to the database.

- **Search (US-013)**: Implemented in the `GET /flashcards` endpoint. The `search` query parameter is translated into a `WHERE (front ILIKE $1 OR back ILIKE $1)` clause, with `$1` being `'%query%'`. The performance trade-off (no index) is accepted for the MVP.

- **Account Deletion (US-005)**: Implemented in the `DELETE /user/me` endpoint. This is a custom API route (e.g., a Supabase Edge Function) that securely gets the user ID from the auth token and calls the Supabase admin function to delete the user. The `ON DELETE CASCADE` constraint handles all data cleanup.
