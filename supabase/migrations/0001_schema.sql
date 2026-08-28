-- ClubConnect schema.
--
-- Mirrors src/demo/types.ts one-for-one, so the client can load a row and use
-- it directly. Ids are text rather than uuid because the six starter clubs have
-- stable, readable ids ("club-football") that the app seeds and refers to.
--
-- RLS is enabled on every table here and NO policies are created, which denies
-- everything. Run 0002 next to open it up for the no-login demo, or write
-- auth-based policies when Google sign-in lands. See the note at the top of
-- 0002 before you run it.

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------- users --
do $$ begin
  create type public.user_role as enum ('student', 'council', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id            text primary key,
  display_name  text not null check (char_length(trim(display_name)) between 2 and 32),
  -- The sign-in address. Never rendered; the officer search matches on it.
  email         text not null unique,
  pfp_url       text,
  role          public.user_role not null default 'student',
  -- Card fields, all optional and all public.
  bio           text check (bio is null or char_length(bio) <= 100),
  instagram     text,
  facebook      text,
  -- A contact address the person chooses to publish, distinct from `email`.
  public_email  text,
  contribution  text check (contribution is null or char_length(contribution) <= 80),
  created_at    timestamptz not null default now()
);

comment on column public.users.email is
  'Private sign-in address. Never expose this to the browser once auth exists.';

-- -------------------------------------------------------------------- clubs --
create table if not exists public.clubs (
  id           text primary key,
  slug         text not null unique,
  name         text not null,
  description  text not null default '',
  banner_url   text,
  theme_color  text not null default '#2f6b4f',
  pattern      text not null default 'confetti',
  -- Null means the seat is vacant. A club exists before it has officers.
  president_id text references public.users (id) on delete set null,
  vp_id        text references public.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

do $$ begin
  create type public.member_status as enum ('invited', 'accepted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_role as enum ('member', 'officer');
exception when duplicate_object then null;
end $$;

create table if not exists public.club_members (
  club_id       text not null references public.clubs (id) on delete cascade,
  user_id       text not null references public.users (id) on delete cascade,
  status        public.member_status not null default 'invited',
  role          public.member_role not null default 'member',
  invited_by_id text references public.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  primary key (club_id, user_id)
);

-- -------------------------------------------------------------------- posts --
create table if not exists public.posts (
  id         text primary key,
  author_id  text not null references public.users (id) on delete cascade,
  -- Null is the main forum. Anything else is that club's own feed.
  club_id    text references public.clubs (id) on delete cascade,
  title      text not null check (char_length(trim(title)) between 1 and 120),
  content    text not null check (char_length(content) between 1 and 5000),
  image_url  text,
  created_at timestamptz not null default now()
);

create index if not exists posts_main_feed_idx
  on public.posts (created_at desc) where club_id is null;
create index if not exists posts_club_feed_idx
  on public.posts (club_id, created_at desc);

do $$ begin
  create type public.reaction_type as enum ('positive', 'negative');
exception when duplicate_object then null;
end $$;

create table if not exists public.reactions (
  post_id    text not null references public.posts (id) on delete cascade,
  user_id    text not null references public.users (id) on delete cascade,
  type       public.reaction_type not null,
  created_at timestamptz not null default now(),
  -- One reaction per person per post. Switching is an update, not a second row.
  primary key (post_id, user_id)
);

-- ------------------------------------------------------------------- events --
create table if not exists public.events (
  id          text primary key,
  title       text not null,
  description text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  color       text not null default '#2f6b6b',
  location    text not null default '',
  image_url   text,
  created_by  text not null references public.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint events_end_after_start check (ends_at > starts_at)
);

create index if not exists events_when_idx on public.events (starts_at);

create table if not exists public.event_signups (
  event_id   text not null references public.events (id) on delete cascade,
  user_id    text not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ------------------------------------------------------------------ council --
do $$ begin
  create type public.council_seat as enum ('president', 'vice-president', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.council (
  user_id text primary key references public.users (id) on delete cascade,
  role    public.council_seat not null default 'member'
);

-- One president and one vice-president at a time.
create unique index if not exists council_one_president_idx
  on public.council (role) where role = 'president';
create unique index if not exists council_one_vp_idx
  on public.council (role) where role = 'vice-president';

-- ---------------------------------------------------------------------- RLS --
-- Enabled with no policies, which denies every client. 0002 opens it up.
alter table public.users         enable row level security;
alter table public.clubs         enable row level security;
alter table public.club_members  enable row level security;
alter table public.posts         enable row level security;
alter table public.reactions     enable row level security;
alter table public.events        enable row level security;
alter table public.event_signups enable row level security;
alter table public.council       enable row level security;

-- ------------------------------------------------------------------ realtime --
-- Every client subscribes to these so one person's change shows up on everyone
-- else's screen without a refresh.
do $$
declare t text;
begin
  foreach t in array array[
    'users', 'clubs', 'club_members', 'posts', 'reactions',
    'events', 'event_signups', 'council'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- --------------------------------------------------------------- club seeds --
-- The six clubs the school already runs. Everything else starts empty.
insert into public.clubs (id, slug, name, description, theme_color, pattern) values
  ('club-football', 'football', 'Football Club',
   'Training twice a week, matches on Saturdays. Eleven-a-side on the school pitch, plus five-a-side in the sports hall over winter. Every position, every skill level. Turn up to a session and we will find you a spot.',
   '#2f6b4f', 'field'),
  ('club-debate', 'debate', 'Debate Club',
   'Parliamentary and Lincoln-Douglas. We practise Tuesdays, argue about everything, and travel to four tournaments a year.',
   '#4a5a7b', 'podium'),
  ('club-film', 'film', 'Film Club',
   'Weekly screenings, monthly shorts, and one very ambitious spring festival. Bring strong opinions about lighting.',
   '#6b4a63', 'filmstrip'),
  ('club-math', 'math', 'Math Club',
   'Competition prep, proof nights, and problems that take a week to crack. No calculators, strong opinions about elegance.',
   '#a35a3a', 'grid'),
  ('club-stem', 'stem', 'STEM Club',
   'Builds, breadboards, and the science fair. Robotics, electronics, and whatever anyone turns up wanting to make.',
   '#2f6b6b', 'circuit'),
  ('club-environmental', 'environmental', 'Environmental Club',
   'Campus garden, the recycling audit, and the river clean-up. Small practical projects, done properly.',
   '#6b7a3a', 'leaves')
on conflict (id) do nothing;
