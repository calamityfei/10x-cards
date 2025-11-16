-- migration: verify rls is working correctly
-- purpose: test that row level security policies are properly enforced
-- affected tables: flashcards, generations
-- special considerations: this is a verification script, not a schema change

-- verify rls is enabled on flashcards table
do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'flashcards' and relnamespace = 'public'::regnamespace) then
    raise exception 'rls is not enabled on public.flashcards';
  end if;
  raise notice 'rls is enabled on public.flashcards';
end $$;

-- verify rls is enabled on generations table
do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'generations' and relnamespace = 'public'::regnamespace) then
    raise exception 'rls is not enabled on public.generations';
  end if;
  raise notice 'rls is enabled on public.generations';
end $$;

-- verify all required policies exist on flashcards table
do $$
declare
  policy_count integer;
begin
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'flashcards';
  
  if policy_count < 4 then
    raise exception 'expected 4 policies on public.flashcards, found %', policy_count;
  end if;
  raise notice 'found % policies on public.flashcards', policy_count;
end $$;

-- verify all required policies exist on generations table
do $$
declare
  policy_count integer;
begin
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'generations';
  
  if policy_count < 2 then
    raise exception 'expected 2 policies on public.generations, found %', policy_count;
  end if;
  raise notice 'found % policies on public.generations', policy_count;
end $$;
