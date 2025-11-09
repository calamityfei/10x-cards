-- migration: disable rls policies on flashcards and generations tables
-- purpose: remove all row level security policies from flashcards and generations tables
-- affected tables: flashcards, generations
-- special considerations: this is a destructive operation that removes data access restrictions

-- drop all rls policies from flashcards table
-- warning: removing these policies will prevent all access to flashcards data until new policies are created
drop policy if exists "enable read access for user's own flashcards" on public.flashcards;
drop policy if exists "enable insert for own flashcards" on public.flashcards;
drop policy if exists "enable update for user's own flashcards" on public.flashcards;
drop policy if exists "enable delete for user's own flashcards" on public.flashcards;

-- drop all rls policies from generations table
-- warning: removing these policies will prevent all access to generations data until new policies are created
drop policy if exists "enable read access for user's own generation logs" on public.generations;
drop policy if exists "enable insert for own generation logs" on public.generations;