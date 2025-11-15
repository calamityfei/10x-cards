-- migration: re-enable rls on flashcards and generations tables
-- purpose: restore row level security policies to ensure users can only access their own data
-- affected tables: flashcards, generations
-- special considerations: this restores data access restrictions for security

-- re-enable row level security on flashcards table
alter table public.flashcards enable row level security;

-- rls policy: users can read their own flashcards
create policy "enable read access for user's own flashcards"
  on public.flashcards
  for select
  using (auth.uid() = user_id);

-- rls policy: users can create flashcards for themselves
create policy "enable insert for own flashcards"
  on public.flashcards
  for insert
  with check (auth.uid() = user_id);

-- rls policy: users can update their own flashcards
create policy "enable update for user's own flashcards"
  on public.flashcards
  for update
  using (auth.uid() = user_id);

-- rls policy: users can delete their own flashcards
create policy "enable delete for user's own flashcards"
  on public.flashcards
  for delete
  using (auth.uid() = user_id);

-- re-enable row level security on generations table
alter table public.generations enable row level security;

-- rls policy: users can read their own generation logs
create policy "enable read access for user's own generation logs"
  on public.generations
  for select
  using (auth.uid() = user_id);

-- rls policy: users can create generation logs for themselves
create policy "enable insert for own generation logs"
  on public.generations
  for insert
  with check (auth.uid() = user_id);
