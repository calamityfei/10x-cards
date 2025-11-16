-- migration: add spaced repetition system (srs) columns to flashcards table
-- purpose: enable study session functionality with fsrs algorithm
-- affected tables: public.flashcards
-- affected indexes: new index idx_flashcards_due for optimizing due cards queries
-- special considerations:
--   - all new columns are nullable or have defaults to support existing flashcards
--   - srs_state defaults to 'New' for new cards
--   - srs_due defaults to now() so new cards are immediately available for study
--   - partial index on (user_id, srs_due) optimizes the common "get due cards" query

-- add srs metadata columns to flashcards table
-- these columns store the state required by the fsrs (free spaced repetition scheduler) algorithm
alter table public.flashcards
  add column srs_state text default 'New',
  add column srs_due timestamptz default now(),
  add column srs_stability real,
  add column srs_difficulty real,
  add column srs_elapsed_days integer default 0,
  add column srs_scheduled_days integer default 0,
  add column srs_reps integer default 0,
  add column srs_lapses integer default 0,
  add column last_reviewed timestamptz;

-- add check constraint to ensure srs_state contains only valid values
-- valid states: 'New', 'Learning', 'Review', 'Relearning'
alter table public.flashcards
  add constraint flashcards_srs_state_check
  check (srs_state in ('New', 'Learning', 'Review', 'Relearning'));

-- add check constraints to ensure non-negative values for counter columns
alter table public.flashcards
  add constraint flashcards_srs_elapsed_days_check
  check (srs_elapsed_days >= 0);

alter table public.flashcards
  add constraint flashcards_srs_scheduled_days_check
  check (srs_scheduled_days >= 0);

alter table public.flashcards
  add constraint flashcards_srs_reps_check
  check (srs_reps >= 0);

alter table public.flashcards
  add constraint flashcards_srs_lapses_check
  check (srs_lapses >= 0);

-- create composite index for efficiently querying due cards
-- this index is used by the "get /flashcards/due" endpoint
-- composite index on (user_id, srs_due) supports the common query pattern:
--   where user_id = $1 and srs_due <= now() order by srs_due asc
create index idx_flashcards_due
  on public.flashcards (user_id, srs_due);

-- add comment to table documenting the new srs columns
comment on column public.flashcards.srs_state is 'fsrs card state: New, Learning, Review, or Relearning';
comment on column public.flashcards.srs_due is 'next review date/time - cards are due when srs_due <= now()';
comment on column public.flashcards.srs_stability is 'fsrs stability parameter - represents memory strength';
comment on column public.flashcards.srs_difficulty is 'fsrs difficulty parameter - represents card difficulty';
comment on column public.flashcards.srs_elapsed_days is 'days since last review';
comment on column public.flashcards.srs_scheduled_days is 'days scheduled for next review';
comment on column public.flashcards.srs_reps is 'number of successful reviews';
comment on column public.flashcards.srs_lapses is 'number of times card was forgotten';
comment on column public.flashcards.last_reviewed is 'timestamp of last review';
