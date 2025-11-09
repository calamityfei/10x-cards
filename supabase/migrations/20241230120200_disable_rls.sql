-- migration: disable rls on flashcards and generations tables
-- purpose: disable all row level security from flashcards and generations tables
-- affected tables: flashcards, generations
-- special considerations: this is a destructive operation that removes data access restrictions

-- disable row level security on flashcards table
-- warning: disabling rls will allow unrestricted access to all flashcards data
alter table public.flashcards disable row level security;

-- disable row level security on generations table
-- warning: disabling rls will allow unrestricted access to all generations data
alter table public.generations disable row level security;
