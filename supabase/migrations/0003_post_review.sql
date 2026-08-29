-- Club post review.
--
-- Ordinary club members can now write into a club, but what they write is a
-- submission rather than a post: it waits until that club's president or vice
-- president approves or denies it. Officers still publish directly, and the
-- main forum is unaffected — only the council's officers and admin can write
-- there, so there is nobody left to review them.
--
-- Safe to run on a database that already has posts: every existing row is
-- backfilled to 'published', which is what it effectively was.

do $$ begin
  create type public.post_status as enum ('published', 'pending', 'denied');
exception when duplicate_object then null;
end $$;

alter table public.posts
  add column if not exists status public.post_status not null default 'published';

alter table public.posts
  add column if not exists reviewed_by_id text
    references public.users (id) on delete set null;

alter table public.posts
  add column if not exists reviewed_at timestamptz;

-- A club officer opening the Review tab wants the handful of rows that are not
-- published; the feed indexes cover the rest.
create index if not exists posts_review_queue_idx
  on public.posts (club_id, created_at desc)
  where status <> 'published';

-- The feed only ever reads published rows now.
drop index if exists posts_main_feed_idx;
drop index if exists posts_club_feed_idx;

create index if not exists posts_main_feed_idx
  on public.posts (created_at desc)
  where club_id is null and status = 'published';

create index if not exists posts_club_feed_idx
  on public.posts (club_id, created_at desc)
  where status = 'published';
