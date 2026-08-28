# ClubConnect — demo build

A reaction-only school forum: announcements, an event calendar, club pages, and
a student council page. Identity is display-only — a display name and picture,
never a real name.

**Shared backend, no login yet.** With Supabase configured, everything lives in
Postgres and every open client updates live. Without it the app falls back to
per-browser `localStorage`, so it still runs with no setup at all. The header
says which mode you are in. The six school clubs ship with the app; accounts,
posts, events and council all start empty.

```bash
npm run dev
```

## Connecting the shared backend

Until you do this, each browser has its own separate school.

1. Create a project at [supabase.com](https://supabase.com).
2. SQL editor, in order:
   - `supabase/migrations/0001_schema.sql` - tables, constraints, realtime, and
     the six starter clubs
   - `supabase/migrations/0002_demo_open_access.sql` - **read the header first.**
     It opens every table to the public anon key, which is the only way a
     no-login app can share data. Every permission in the UI becomes cosmetic
     until sign-in exists.
3. Create `.env.local` with the two values from Project Settings -> API Keys:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart the dev server, then check it:

   ```bash
   npm run check:backend
   ```

   It verifies the keys are real and belong to one project, that the project
   answers, and that all eight tables exist and are readable.

### Before real students use it

The open-access policies are a demo compromise, not a security model. Anyone
with the anon key, which ships in the browser bundle, can read and write every
row. Add Google sign-in, drop the `demo open access` policies, and rewrite them
against `auth.uid()` before this holds anything real.

## Starting from empty

First load asks you to make the first account. Make it **Admin** — admin is what
can create clubs and appoint the council, so starting as a student leaves you
with nothing to do.

From there, in roughly this order:

1. **Add accounts** — the "Viewing as" menu, top right → *Add an account*. Give
   each one a role: Student, Student Council, or Admin. The same menu switches
   between them, which is how you demo the permission rules without auth.
2. **Council** → *Add council member*. Appointing someone also grants them the
   council role, so they can post announcements.
3. **Clubs** — the dropdown in the header lists Football, Debate, Film, Math,
   STEM, and Environmental, each with its own colour and banner artwork. They
   start with vacant officer seats: open a club → *About* → assign a president
   and VP (admin only), and those people can then post to it and invite members.
   *New club* on the Clubs page adds more, with a banner style to pick from.
4. **Forum** → post an announcement (Council/Admin only). Everyone else reacts.
5. **Events** → a Google Calendar-style view: Month, Week, Day, and Schedule,
   with Today / arrow navigation and a mini-month rail on wide screens. Click
   any day or hour to create an event there (Council/Admin only); click an
   event to open its card and sign up.

The "Viewing as" menu also has **Start over — erase everything**, which puts you
back at the first-run screen.

## Worth showing

- **Reactions** — 👍/👎, one per person. Click again to undo, click the other to
  switch. Counts are public.
- **Event privacy** — anyone can sign up, but the list of who's going, and its
  count, appear only to the organizer. Create an event on one account and look
  at it from another.
- **The calendar itself** — put two events at overlapping times and open Week
  view: they split into side-by-side columns. All-day events sit in the band
  above the hour grid, and a red line marks the current time on today.
- **The invite tool** — Clubs → a club → Members, as its president. Search a
  full school email; it returns a picture and display name only, never the email
  back, and partial matches don't work. Invite someone, switch to that account,
  accept from their profile.
- **Club feeds** — each club's posts are separate from the main forum and from
  every other club.
- **Per-club identity** — the banner motif is drawn per club (a pitch for
  Football, a filmstrip for Film, graph paper for Math, circuit traces for
  STEM), and the club's colour carries through its badge and tab underline.

## Structure

```
src/demo/types.ts       shapes, mirroring the eventual database tables
src/demo/initial.ts     the empty starting state + avatar/slug helpers
src/demo/store.tsx      state + actions + localStorage; the whole "backend"
src/demo/selectors.ts   derived reads and the permission rules
src/components/         Avatar, PostCard, ReactionBar, composers, InviteTool
src/components/ClubArt.tsx        per-club banner motifs, drawn as inline SVG
src/components/calendar/          the Google-Calendar-style event views
src/app/                forum, events, clubs, council, profile
```

Permissions live in `selectors.ts` (`canPostToMainForum`, `canManageEvents`,
`isClubOfficer`, `canSeeSignups`) rather than being scattered through the UI, so
when a real backend arrives those are the rules to re-enforce server-side.

## What isn't here yet

Login, a real database, image uploads, and a school-roster allowlist. Post cover
images and profile pictures are generated as inline SVG rather than uploaded.
Nothing is actually enforced — every rule is client-side, which is fine for
showing the product and not fine for running it.
