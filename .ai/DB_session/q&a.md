Here is the list of questions and recommendations to help build the database structure:

1st phase:

Question: Given the tech stack includes Supabase, are we correct to assume we will not create a public users table, but will instead reference Supabase's built-in auth.users table via its id (a UUID)? Recommendation: Yes, this is the standard Supabase practice. Our schema's tables (e.g., flashcards) should have a user_id UUID column that is a foreign key referencing auth.users(id).

Answer: Yes, we want the "users" entity to be managed by Supabase Auth, and other tables will reference it using foreign key. We will need to have fields like "id", "email", "encypted_password", "created_at", "confirmed_at".

Question: The PRD states "a single 'default deck'" (4.1) and "multi-deck management is out of scope" (4.2). For future scalability, should we create a decks table now, or just add a user_id to the flashcards table and omit decks entirely for the MVP? Recommendation: We should create a decks table now. It can be simple: id (UUID, PK), user_id (UUID, FK to auth.users), name (TEXT, default 'Default Deck'). We can use a Supabase Function (a PostgreSQL trigger) to automatically create one default deck for each new user upon signup. This is far more scalable.

Answer: For the MVP, let's omit decks and have "flashcards" reference "user_id" directly.

Question: For the "Study Session" (3.5), we need to store the spaced repetition state per card. What specific data fields will the chosen "open-source spaced repetition library" require? Recommendation: We must identify the library's needs. A common requirement is for fields on the flashcards table like: due_at (TIMESTAMPTZ), interval (INT), and ease_factor (NUMERIC). For the simple "Forgot" / "Knew" system, it might just be a leech_level (INT) or box_number (INT). This needs clarification before the flashcards table is finalized.

Answer: Let's not implement the study session state or history for now. This will be added later on, when we integrate open-source solution for spaced repetition. Please concentrate on the flashcard generation process for now.

Question: The "My flashcards" page (3.4) requires a search that queries both the front and back fields. A standard LIKE '%query%' search will be very slow. Are we open to using a PostgreSQL-specific extension for efficient full-text search? Recommendation: We should enable the pg_trgm (trigram) extension in PostgreSQL. We can then create a single GIN (Generalized Inverted Index) on both the front and back columns. This will make ILIKE-based searches extremely fast, even on large tables.

Answer: We don't expect to have search time efficiency problems on the MVP stage. Let's stick with standard LIKE query.

Question: To track Success Metric 6.2 ("75% of flashcards are created using AI"), we need to know the origin of every card. Should we add a source column to the flashcards table? Recommendation: Yes, we must add a source column to the flashcards table. I recommend using a PostgreSQL ENUM type for this: CREATE TYPE card_source AS ENUM ('ai', 'manual'). This field should be NOT NULL.

Answer: We should definitely add a "source" field to the "flashcards" table. It should be not-null, of ENUM type ("ai_full", "ai_edited" and "manual")

Question: To track Success Metric 6.1 ("75% of AI cards are accepted"), we must log the "Accept", "Edit", and "Delete" actions (US-007, 008, 009), which happen before a card is saved. Should we create a separate ai_generation_log table for this? Recommendation: Yes, creating a separate log table is the only way to accurately track this. The table should include id, user_id, action (ENUM 'accept', 'edit', 'delete'), and created_at. This allows us to calculate the metric with a simple SQL query.

Answer: Yes, we should have a "generations" table, with fields that will help with traceability and statistics calculation: id (BIGSERIAL), user_id (FK), model, generation_time, generated_count, accepted_unedited_count, accepted_edited_count, deleted_count, source_text_hash, source_text_length, created_at.

Question: User Story US-005 (Delete Account) requires all user data to be deleted. How should this be enforced at the database level? Recommendation: All tables with a user_id foreign key (flashcards, decks, ai_generation_log) should be created with the ON DELETE CASCADE constraint. This ensures that when a user is deleted from auth.users, all their associated data is automatically and cleanly removed from the database.

Answer: Yes, let's go with the recommended approach here for" ON DELETE CASCADE" constraint.

Question: What are the core Row-Level Security (RLS) policies required for this MVP, given we are using Supabase? Recommendation: We must enable RLS on all tables containing user data (flashcards, decks, ai_generation_log). The policies should be:

SELECT/UPDATE/DELETE: Users can only perform these operations on rows where auth.uid() = user_id.

INSERT: Users can only insert new rows where auth.uid() = user_id.

Answer: Yes, for MVP let's go with a simple user verification based on "user_id" column for all operations.

Question: What indexes, besides the search index (Q4), are critical for MVP performance? Recommendation: We must create standard B-tree indexes on all foreign key columns: flashcards(user_id), flashcards(deck_id), and decks(user_id). Most importantly, we must create an index on the flashcards(due_at) column, as this will be the primary WHERE clause for the "Study Session" (US-017).

Answer: Propose necessary indexes to be made.

Question: What data type should be used for the front and back fields on the flashcards table? The input text can be up to 10,000 characters (3.2). Recommendation: We should use the TEXT data type. In PostgreSQL, TEXT has no performance disadvantage compared to VARCHAR(n) and can store data of virtually unlimited length, which is perfect for user-generated content and AI output.

Answer: Let's stick with VARCHAR for those fields. The "front" should be limited to 200 chars, while "back" to 500 chars. As for the source text length field "source_text_length", it should have a restriction of numeric value between 1000 and 10000.

2nd phase:

Question: To confirm, since we are using Supabase Auth, we will not create any public users or profiles table for the MVP, and all user-related data will be handled by the private auth.users table, correct? Recommendation: This is the standard and recommended Supabase practice. We can add a separate profiles table later 1-to-1 with auth.users(id) if we need to store public metadata like usernames or avatars, but it's not needed for the MVP.

Answer: Yes, we don't want a public "users" table, but a fully Supabase Auth managed one.

Question: You specified a LIKE query for search (US-013). Will the search query match text anywhere in the field (e.g., LIKE '%query%') or only from the beginning of the field (e.g., LIKE 'query%')? Recommendation: Standard B-tree indexes will only accelerate LIKE 'query%' (prefix) searches. If you must use LIKE '%query%', it will not use an index and will be slow as the table grows. For the MVP, this is likely acceptable, but we should acknowledge the performance trade-off.

Answer: Let's match anywhere in the field. For MVP it will be acceptable to not have an index on it.

Question: We have the generations table (Q6) for session summaries and the flashcards table (Q5) for individual card sources. Is the intended data flow that the frontend client tracks all review actions ("Accept", "Edit", "Delete") and then, on final save, it (1) inserts the batch of flashcards with the correct source ENUM and (2) inserts a single row into generations with the total counts for that session? Recommendation: This is an excellent and efficient design. It perfectly supports both the application logic (saving cards) and the success metrics (tracking the generation event) in two clean database operations.

Answer: Yes, this recommendation is the intended flow.

Question: What data type should we use for the model column in the generations table? Recommendation: I suggest VARCHAR(100) or TEXT. This provides flexibility to store model names provided by Openrouter, such as openai/gpt-4-turbo or anthropic/claude-3-opus.

Answer: Let's go with VARCHAR(100).

Question: What data type and unit should we use for the generation_time column in the generations table? Recommendation: I recommend INTEGER. We can store the time in milliseconds, which is a language-agnostic and precise-enough standard for tracking generation performance.

Answer: INTEGER will be enough.

Question: What data type should we use for the source_text_hash in the generations table? Recommendation: I recommend CHAR(64). This is the perfect size to store a SHA-256 hash, which is a standard 64-character hexadecimal string. It is more storage-efficient than TEXT if the length is fixed.

Answer: Let's go with CHAR(64) for storing a SHA-256 hash.

Question: You asked for index proposals. Are the following indexes sufficient for the MVP? Recommendation: I recommend creating these B-tree indexes:

CREATE INDEX ON flashcards (user_id); (Essential for RLS and fetching a user's cards)

CREATE INDEX ON generations (user_id); (Essential for RLS and any future metric queries)

CREATE INDEX ON flashcards (front); (Will be used for LIKE 'query%' searches on the 'front' field)

CREATE INDEX ON flashcards (back); (Will be used for LIKE 'query%' searches on the 'back' field)

Answer: Let's go with the recommended indexes on "user_id" in "flashcards" and "generations". For indexes on "front" and "back" - those will probably won't be needed, as we will use "LIKE '%query%'" searches on them.

Question: The flashcards table has front VARCHAR(200) and back VARCHAR(500). What is the desired behavior if the AI (or a manual user) provides text that exceeds these limits? Recommendation: The database will reject the INSERT or UPDATE with an error. We must ensure the frontend client (the modal) and the AI prompt (e.g., "front must be under 200 chars") enforce these limits before the data is sent to the database.

Answer: We will have validation on the app's frontend client as well.

Question: For the generations table, should we add database-level constraints for the numeric fields? Recommendation: Yes, we should use CHECK constraints to ensure data integrity:

ALTER TABLE generations ADD CONSTRAINT check_source_length CHECK (source_text_length >= 1000 AND source_text_length <= 10000);

ALTER TABLE generations ADD CONSTRAINT check_generation_time CHECK (generation_time > 0);

ALTER TABLE generations ADD CONSTRAINT check_counts CHECK (generated_count >= 0 AND accepted_unedited_count >= 0 AND accepted_edited_count >= 0 AND deleted_count >= 0);

Answer: Add the suggested constraints "check_source_length" and "check_generation_time".

Question: Regarding the source ENUM (ai_full, ai_edited, manual), when a user "edits" a card from the review list (US-008), does it get the ai_edited status only if the original source was AI? What if they manually create a card and then edit it from the "My flashcards" page? Recommendation: The source ENUM should represent the origin of the card. I recommend it be set once at creation and never change.

manual: Card was created using the "Add Manually" button.

ai_full: Card was generated by AI and "Accepted" without edits.

ai_edited: Card was generated by AI and "Edited" during the initial review. Subsequent edits from the "My flashcards" page (US-015) should not change this source field.

Answer: Yes, it should be set only at creation and never change later. Manually created flashcards can't get any "ai_*" source by any means.
