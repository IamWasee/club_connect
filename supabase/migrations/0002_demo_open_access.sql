-- OPEN ACCESS. READ THIS BEFORE RUNNING IT.
--
-- ClubConnect has no login yet: people pick who they are from a menu. There is
-- therefore no `auth.uid()` for a policy to check, so the only way the shared
-- backend can work at all is to let the anonymous key read and write every
-- table.
--
-- What that means in practice:
--
--   * Anyone who has the anon key, which ships in the browser bundle and is
--     therefore public, can read every row and write every row.
--   * Every permission in the app (who may post, who may create events, who may
--     see the student directory) is enforced in the UI only. It is cosmetic.
--     A determined student with the browser console can bypass all of it.
--
-- That is fine for a demo among people you trust. It is NOT fine once real
-- students are on it. Before that happens: add Google sign-in, drop these
-- policies, and replace them with auth-based ones keyed on `auth.uid()`.
--
-- To undo this file:
--   drop policy "demo open read" on public.users;   -- and so on per table
-- or simply re-run 0001, which leaves RLS on with nothing granted.

do $$
declare t text;
begin
  foreach t in array array[
    'users', 'clubs', 'club_members', 'posts', 'reactions',
    'events', 'event_signups', 'council'
  ] loop
    execute format(
      'drop policy if exists "demo open access" on public.%I', t
    );
    execute format(
      'create policy "demo open access" on public.%I
         for all to anon, authenticated
         using (true) with check (true)', t
    );
    execute format(
      'grant select, insert, update, delete on public.%I to anon, authenticated', t
    );
  end loop;
end $$;
