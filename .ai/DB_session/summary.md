# Database Planning Summary

## Decisions

1.  **User Management:** User authentication will be handled exclusively by Supabase Auth. There will be no public `users` or `profiles` table; all other tables will reference `auth.users(id)` via a `user_id` (UUID) foreign key.
2.  **Core Entities:** The MVP schema will consist of two primary tables: `flashcards` and `generations`.
3.  **Deck Management:** The concept of "decks" is omitted for the MVP. The `flashcards` table will link directly to `user_id`.
4.  **Spaced Repetition:** All fields related to the spaced repetition algorithm (e.g., `due_at`, `interval`, `ease_factor`) are intentionally deferred and will not be included in the `flashcards` table for the MVP.
5.  **`flashcards` Table Schema:**
    - `front`: `VARCHAR(200)`
    - `back`: `VARCHAR(500)`
    - `source`: A `NOT NULL` ENUM type named `card_source` with three values: `('ai_full', 'ai_edited', 'manual')`. This value is set _only_ at creation and is immutable.
6.  **`generations` Table Schema:**
    - `id`: `BIGSERIAL`
    - `user_id`: `UUID` (FK to `auth.users`)
    - `model`: `VARCHAR(100)`
    - `generation_time`: `INTEGER` (storing milliseconds)
    - `source_text_hash`: `CHAR(64)` (for a SHA-256 hash)
    - `source_text_length`: `INTEGER`
    - `generated_count`: `INTEGER`
    - `accepted_unedited_count`: `INTEGER`
    - `accepted_edited_count`: `INTEGER`
    - `deleted_count`: `INTEGER`
    - `created_at`: `TIMESTAMPTZ` (default `now()`)
7.  **Data Flow:** The frontend client will track all review actions (accept, edit, delete). Upon final save, it will batch-insert the `flashcards` (with the correct `source` ENUM) and insert a _single row_ into the `generations` table summarizing the event.
8.  **Data Integrity:**
    - All foreign keys referencing `user_id` will use `ON DELETE CASCADE` to handle account deletion.
    - The `generations` table will have `CHECK` constraints: `CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` and `CHECK (generation_time > 0)`.
9.  **Indexing:**
    - Indexes will be created on `flashcards(user_id)` and `generations(user_id)`.
    - No indexes will be created on `flashcards.front` or `flashcards.back` for the MVP.
10. **Search:** The "My flashcards" search will use a `LIKE '%query%'` (match anywhere) query. The associated performance cost (no index use) is acceptable for the MVP.
11. **Security:** Row-Level Security (RLS) will be enabled on both `flashcards` and `generations`, restricting all operations (SELECT, INSERT, UPDATE, DELETE) based on `auth.uid() = user_id`.

## Matched Recommendations

1.  **Supabase Auth:** The recommendation to use Supabase's built-in `auth.users` table as the single source of truth for user identity was accepted.
2.  **Metrics Tracking:** The recommendation to create a `source` ENUM on the `flashcards` table (to track Metric 6.2) and a separate `generations` table (to track Metric 6.1) was accepted and defined.
3.  **Data Flow:** The recommended data flow (client tracks review, saves cards and one summary log row) was confirmed as the intended implementation.
4.  **Data Types:** Recommendations for `VARCHAR(100)` for the `model`, `INTEGER` for `generation_time`, and `CHAR(64)` for the hash were accepted.
5.  **Cascade Deletion:** The recommendation to use `ON DELETE CASCADE` for foreign keys to handle account deletion (US-005) was accepted.
6.  **Row-Level Security:** The recommendation to implement simple, user-ID-based RLS policies on all user-data tables was accepted.
7.  **Indexes:** The recommendation to index all `user_id` foreign key columns was accepted.
8.  **Constraints:** The recommendation to add database-level `CHECK` constraints for data integrity was accepted (specifically for `source_text_length` and `generation_time`).
9.  **Data Immutability:** The recommendation that the `source` ENUM be set once at creation and never change was accepted.

## Database Planning Summary

### 1. Main Requirements for the Database Schema

The database schema for the MVP is designed to be minimal, focusing entirely on the core user flows of account management, flashcard generation, and flashcard management. It explicitly _omits_ all logic for spaced repetition study sessions and multi-deck management. The schema's primary purpose is to store user flashcards and gather the success metrics defined in the PRD (AI generation quality and AI feature adoption).

### 2. Key Entities and Their Relationships

The schema will be built on the Supabase (PostgreSQL) backend.

- **`auth.users` (Entity, Handled by Supabase)**
  - This is the primary "user" entity, managed by Supabase Auth.
  - It serves as the parent for all user-owned data via its `id` (UUID).

- **`flashcards` (Table)**
  - This table stores the individual flashcards created by users.
  - **Fields:**
    - `id` (PK, e.g., BIGSERIAL or UUID)
    - `user_id` (UUID, FK to `auth.users(id)`)
    - `front` (VARCHAR(200), NOT NULL)
    - `back` (VARCHAR(500), NOT NULL)
    - `source` (ENUM `card_source` (`'ai_full'`, `'ai_edited'`, `'manual'`), NOT NULL)
    - `created_at` (TIMESTAMPTZ, default `now()`)
    - `updated_at` (TIMESTAMPTZ, default `now()`)
  - **Relationship:** There is a **one-to-many** relationship between `auth.users` and `flashcards` (a user can have many flashcards).

- **`generations` (Table)**
  - This table is a log used to track the summary of each AI generation event, primarily for calculating success metrics.
  - **Fields:**
    - `id` (PK, BIGSERIAL)
    - `user_id` (UUID, FK to `auth.users(id)`)
    - `model` (VARCHAR(100))
    - `generation_time` (INTEGER, in ms)
    - `source_text_hash` (CHAR(64))
    - `source_text_length` (INTEGER)
    - `generated_count` (INTEGER)
    - `accepted_unedited_count` (INTEGER)
    - `accepted_edited_count` (INTEGER)
    - `deleted_count` (INTEGER)
    - `created_at` (TIMESTAMPTZ, default `now()`)
  - **Relationship:** There is a **one-to-many** relationship between `auth.users` and `generations` (a user can have many generation events).

### 3. Important Security and Performance Concerns

- **Security (RLS):** Row-Level Security will be the primary data protection mechanism. RLS policies will be enabled on both `flashcards` and `generations` to ensure a user can _only_ access their own rows. All policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) will be based on the check `auth.uid() = user_id`.
- **Data Integrity:**
  - Account deletion (US-005) is handled at the database level using the `ON DELETE CASCADE` constraint on the `user_id` foreign keys.
  - `CHECK` constraints on the `generations` table (`source_text_length`, `generation_time`) will prevent invalid data from being saved.
- **Performance:**
  - **Indexes:** Only the `user_id` columns will be indexed. This is critical for the performance of RLS policies and fetching data for a specific user.
  - **Search:** Search functionality (US-013) will use `LIKE '%query%'`. It is an accepted decision for the MVP that this query will _not_ use an index and will perform a full table scan, which may become slow as the `flashcards` table grows.

## Unresolved Issues

- **Data Integrity (Minor):** The user did not explicitly accept the recommendation to add `CHECK` constraints to the count fields in the `generations` table (e.g., `CHECK (generated_count >= 0)`). This is a minor risk but could allow for negative numbers to be stored if there is a bug in the client-side reporting.
