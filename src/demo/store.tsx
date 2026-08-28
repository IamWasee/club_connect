"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Onboarding } from "@/components/Onboarding";
import { REALTIME_TABLES, db, ensureStarterClubs, loadAll } from "@/lib/db";
import { getSupabase, isBackendConfigured } from "@/lib/supabase";
import { DEFAULT_EVENT_COLOR } from "./calendar";
import { STARTER_CLUBS, createEmpty, slugify } from "./initial";
import { BIO_MAX } from "./types";
import type {
  Club,
  ClubPattern,
  CouncilSeat,
  DemoState,
  Event,
  ReactionType,
  Role,
  User,
} from "./types";

/**
 * Application state.
 *
 * Two modes, decided once at startup by whether the Supabase env vars are set:
 *
 *   backend  Everything lives in Postgres and is shared. Every client
 *            subscribes to changes, so one person's post appears on everyone
 *            else's screen without a refresh.
 *   local    Per-browser localStorage. The fallback while the project is being
 *            set up, so the app still runs with no configuration at all.
 *
 * Which account this browser is acting as stays local either way: there is no
 * login yet, so "who am I" is a per-device choice, not shared state.
 */
const STORAGE_KEY = "clubconnect.demo.v2";
const ACTING_AS_KEY = "clubconnect.actingAs";

type Mode = "backend" | "local";

type Ctx = {
  state: DemoState;
  me: User;
  mode: Mode;
  /** Set when talking to the backend failed, so the UI can say so. */
  error: string | null;
  dismissError: () => void;
  update: (fn: (draft: DemoState) => DemoState) => void;
  reset: () => void;
};

const DemoContext = createContext<Ctx | null>(null);

/* ---------------------------------------------------------------- local IO */

function loadLocal(): DemoState {
  if (typeof window === "undefined") return createEmpty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmpty();
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed?.users)) return createEmpty();
    return migrate(parsed);
  } catch {
    return createEmpty();
  }
}

function readActingAs(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(ACTING_AS_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeActingAs(id: string) {
  try {
    window.localStorage.setItem(ACTING_AS_KEY, id);
  } catch {
    // Private mode. The choice just will not survive a refresh.
  }
}

const STARTER_REV = "2";

/** Brings a localStorage save forward to the current shape. */
function migrate(state: DemoState): DemoState {
  const clubs = state.clubs ?? [];

  return {
    ...state,
    starterRev: STARTER_REV,
    users: (state.users ?? []).map((user) => {
      const seat = (state.council ?? []).find((c) => c.userId === user.id);
      return user.bio === undefined && seat?.bio ? { ...user, bio: seat.bio } : user;
    }),
    clubs: (clubs.length === 0 ? STARTER_CLUBS.map((club) => ({ ...club })) : clubs).map(
      (club) => {
        const base = { ...club, pattern: club.pattern ?? "confetti" };
        if (state.starterRev === STARTER_REV) return base;
        const starter = STARTER_CLUBS.find((entry) => entry.id === club.id);
        return starter
          ? {
              ...base,
              themeColor: starter.themeColor,
              pattern: starter.pattern,
              description: starter.description,
            }
          : base;
      },
    ),
    events: (state.events ?? []).map((event) => ({
      ...event,
      endDate: event.endDate ?? new Date(new Date(event.date).getTime() + 3_600_000).toISOString(),
      allDay: event.allDay ?? false,
      color: event.color ?? DEFAULT_EVENT_COLOR,
    })),
  };
}

/* ------------------------------------------------------------- the provider */

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [mode] = useState<Mode>(() => (isBackendConfigured() ? "backend" : "local"));
  const [state, setState] = useState<DemoState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A burst of realtime events should cause one round trip, not ten.
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await loadAll();
      if (!next) return;
      setError(null);
      setState((current) => ({
        ...next,
        // A refetch must never change who this browser is acting as.
        currentUserId: current?.currentUserId || readActingAs(),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not reach the backend.");
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => void refresh(), 120);
  }, [refresh]);

  useEffect(() => {
    if (mode === "local") {
      setState(loadLocal());
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await ensureStarterClubs();
        const next = await loadAll();
        if (cancelled || !next) return;

        const acting = readActingAs();
        setState({
          ...next,
          currentUserId: next.users.some((u) => u.id === acting) ? acting : "",
        });
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not reach the backend.");
        // Render the app rather than a dead loading screen. It will be empty
        // until the connection works.
        setState({ ...createEmpty(), users: [], currentUserId: "" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Live updates: what anyone changes lands on every other open client.
  useEffect(() => {
    if (mode !== "backend") return;
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase.channel("clubconnect");
    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }
    channel.subscribe();

    return () => {
      if (pending.current) clearTimeout(pending.current);
      void supabase.removeChannel(channel);
    };
  }, [mode, scheduleRefresh]);

  // localStorage persistence, local mode only.
  useEffect(() => {
    if (mode !== "local" || !state) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode or a full quota.
    }
  }, [mode, state]);

  const update = useCallback((fn: (draft: DemoState) => DemoState) => {
    setState((current) => {
      if (!current) return current;
      const next = fn(current);
      if (next.currentUserId !== current.currentUserId) writeActingAs(next.currentUserId);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    writeActingAs("");
    if (mode === "backend") {
      void db
        .wipeEverything()
        .then(refresh)
        .catch((cause: unknown) =>
          setError(cause instanceof Error ? cause.message : "Could not clear the backend."),
        );
      return;
    }
    setState(createEmpty());
  }, [mode, refresh]);

  const dismissError = useCallback(() => setError(null), []);

  const value = useMemo<Ctx | null>(() => {
    if (!state || state.users.length === 0) return null;
    const me = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];
    return { state, me, mode, error, dismissError, update, reset };
  }, [state, mode, error, dismissError, update, reset]);

  if (!state) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-subtle">Loading ClubConnect…</p>
      </div>
    );
  }

  if (!value) {
    return <Onboarding update={update} mode={mode} error={error} />;
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

/* ----------------------------------------------------------------- actions */

export const newId = () => `x-${Math.random().toString(36).slice(2, 10)}`;

export type NewAccount = {
  displayName: string;
  email: string;
  pfpUrl: string | null;
  role: Role;
};

/**
 * Add an account to a draft, and to the backend when there is one. Used by
 * onboarding, which runs before the context exists and so cannot use
 * `useActions`.
 */
export function addAccount(draft: DemoState, input: NewAccount, signIn: boolean): DemoState {
  const user: User = { id: newId(), ...input };
  if (isBackendConfigured()) {
    void db.upsertUser({ ...user }).catch((cause) => {
      console.error("ClubConnect: could not save the first account", cause);
    });
  }
  return {
    ...draft,
    users: [...draft.users, user],
    currentUserId: signIn || draft.users.length === 0 ? user.id : draft.currentUserId,
  };
}

export function useActions() {
  const { update, reset, mode, state } = useDemo();

  /**
   * Every action runs twice: locally so the UI responds immediately, then
   * against the backend. Realtime reconciles every other client. In local mode
   * the second half is skipped.
   */
  const mutate = useCallback(
    (local: (draft: DemoState) => DemoState, remote?: () => Promise<void>) => {
      update(local);
      if (mode !== "backend" || !remote) return;
      remote().catch((cause: unknown) => {
        // The next realtime event or reload puts local state back in line with
        // the server, so this is logged rather than thrown at the user.
        console.error("ClubConnect write failed", cause);
      });
    },
    [update, mode],
  );

  return useMemo(
    () => ({
      reset,

      switchUser: (userId: string) => update((d) => ({ ...d, currentUserId: userId })),

      createAccount: (input: NewAccount, signIn: boolean) => {
        const user: User = { id: newId(), ...input };
        mutate(
          (d) => ({
            ...d,
            users: [...d.users, user],
            currentUserId: signIn || d.users.length === 0 ? user.id : d.currentUserId,
          }),
          () => db.upsertUser(user),
        );
      },

      deleteAccount: (userId: string) =>
        mutate(
          (d) => {
            const remaining = d.users.filter((u) => u.id !== userId);
            if (remaining.length === 0) return d;
            const theirPosts = new Set(
              d.posts.filter((p) => p.authorId === userId).map((p) => p.id),
            );
            const theirEvents = new Set(
              d.events.filter((e) => e.createdBy === userId).map((e) => e.id),
            );
            return {
              ...d,
              users: remaining,
              currentUserId: d.currentUserId === userId ? remaining[0].id : d.currentUserId,
              posts: d.posts.filter((p) => p.authorId !== userId),
              reactions: d.reactions.filter(
                (r) => r.userId !== userId && !theirPosts.has(r.postId),
              ),
              events: d.events.filter((e) => e.createdBy !== userId),
              eventSignups: d.eventSignups.filter(
                (s) => s.userId !== userId && !theirEvents.has(s.eventId),
              ),
              clubMembers: d.clubMembers.filter((m) => m.userId !== userId),
              council: d.council.filter((c) => c.userId !== userId),
              clubs: d.clubs.map((c) => ({
                ...c,
                presidentId: c.presidentId === userId ? null : c.presidentId,
                vpId: c.vpId === userId ? null : c.vpId,
              })),
            };
          },
          () => db.deleteUser(userId),
        ),

      setRole: (userId: string, role: Role) =>
        mutate(
          (d) => ({
            ...d,
            users: d.users.map((u) => (u.id === userId ? { ...u, role } : u)),
            council:
              role === "council" ? d.council : d.council.filter((c) => c.userId !== userId),
          }),
          () => db.updateUser(userId, { role }),
        ),

      updateProfile: (
        patch: Partial<
          Pick<
            User,
            | "displayName"
            | "pfpUrl"
            | "bio"
            | "instagram"
            | "facebook"
            | "publicEmail"
            | "contribution"
          >
        >,
      ) => {
        const id = state.currentUserId;
        mutate(
          (d) => ({
            ...d,
            users: d.users.map((u) => (u.id === d.currentUserId ? { ...u, ...patch } : u)),
          }),
          () =>
            db.updateUser(id, {
              ...(patch.displayName !== undefined && { display_name: patch.displayName }),
              ...(patch.pfpUrl !== undefined && { pfp_url: patch.pfpUrl }),
              ...(patch.bio !== undefined && { bio: patch.bio || null }),
              ...(patch.instagram !== undefined && { instagram: patch.instagram || null }),
              ...(patch.facebook !== undefined && { facebook: patch.facebook || null }),
              ...(patch.publicEmail !== undefined && { public_email: patch.publicEmail || null }),
              ...(patch.contribution !== undefined && {
                contribution: patch.contribution || null,
              }),
            }),
        );
      },

      createPost: (input: {
        clubId: string | null;
        title: string;
        content: string;
        imageUrl: string | null;
      }) => {
        const post = {
          id: newId(),
          authorId: state.currentUserId,
          createdAt: new Date().toISOString(),
          ...input,
        };
        mutate(
          (d) => ({ ...d, posts: [post, ...d.posts] }),
          () =>
            db.insertPost({
              id: post.id,
              author_id: post.authorId,
              club_id: post.clubId,
              title: post.title,
              content: post.content,
              image_url: post.imageUrl,
              created_at: post.createdAt,
            }),
        );
      },

      deletePost: (postId: string) =>
        mutate(
          (d) => ({
            ...d,
            posts: d.posts.filter((p) => p.id !== postId),
            reactions: d.reactions.filter((r) => r.postId !== postId),
          }),
          () => db.deletePost(postId),
        ),

      react: (postId: string, type: ReactionType) => {
        const userId = state.currentUserId;
        const mine = state.reactions.find((r) => r.postId === postId && r.userId === userId);
        const clearing = mine?.type === type;

        mutate(
          (d) => {
            const existing = d.reactions.find(
              (r) => r.postId === postId && r.userId === d.currentUserId,
            );
            if (!existing) {
              return { ...d, reactions: [...d.reactions, { postId, userId, type }] };
            }
            if (existing.type === type) {
              return {
                ...d,
                reactions: d.reactions.filter(
                  (r) => !(r.postId === postId && r.userId === d.currentUserId),
                ),
              };
            }
            return {
              ...d,
              reactions: d.reactions.map((r) =>
                r.postId === postId && r.userId === d.currentUserId ? { ...r, type } : r,
              ),
            };
          },
          () =>
            clearing ? db.clearReaction(postId, userId) : db.setReaction(postId, userId, type),
        );
      },

      createEvent: (input: Omit<Event, "id" | "createdBy">) => {
        const event = { ...input, id: newId(), createdBy: state.currentUserId };
        mutate(
          (d) => ({ ...d, events: [...d.events, event] }),
          () =>
            db.insertEvent({
              id: event.id,
              title: event.title,
              description: event.description,
              starts_at: event.date,
              ends_at: event.endDate,
              all_day: event.allDay,
              color: event.color,
              location: event.location,
              image_url: event.imageUrl,
              created_by: event.createdBy,
            }),
        );
      },

      deleteEvent: (eventId: string) =>
        mutate(
          (d) => ({
            ...d,
            events: d.events.filter((e) => e.id !== eventId),
            eventSignups: d.eventSignups.filter((s) => s.eventId !== eventId),
          }),
          () => db.deleteEvent(eventId),
        ),

      toggleSignup: (eventId: string) => {
        const userId = state.currentUserId;
        const signed = state.eventSignups.some(
          (s) => s.eventId === eventId && s.userId === userId,
        );
        mutate(
          (d) => ({
            ...d,
            eventSignups: signed
              ? d.eventSignups.filter((s) => !(s.eventId === eventId && s.userId === userId))
              : [...d.eventSignups, { eventId, userId }],
          }),
          () => (signed ? db.removeSignup(eventId, userId) : db.addSignup(eventId, userId)),
        );
      },

      createClub: (input: {
        name: string;
        description: string;
        themeColor: string;
        pattern: ClubPattern;
        presidentId: string | null;
        vpId: string | null;
      }) => {
        const id = newId();
        const base = slugify(input.name);
        const taken = new Set(state.clubs.map((c) => c.slug));
        let slug = base;
        for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;

        const officers = [input.presidentId, input.vpId].filter((v): v is string => Boolean(v));

        mutate(
          (d) => ({
            ...d,
            clubs: [...d.clubs, { id, slug, bannerUrl: null, ...input }],
            clubMembers: [
              ...d.clubMembers,
              ...officers.map((userId) => ({
                clubId: id,
                userId,
                status: "accepted" as const,
                role: "officer" as const,
                invitedById: null,
              })),
            ],
          }),
          async () => {
            await db.upsertClub({
              id,
              slug,
              name: input.name,
              description: input.description,
              theme_color: input.themeColor,
              pattern: input.pattern,
              president_id: input.presidentId,
              vp_id: input.vpId,
            });
            await db.upsertMembers(
              officers.map((userId) => ({
                club_id: id,
                user_id: userId,
                status: "accepted",
                role: "officer",
              })),
            );
          },
        );
      },

      updateClub: (
        clubId: string,
        patch: Partial<Pick<Club, "description" | "themeColor" | "bannerUrl">>,
      ) =>
        mutate(
          (d) => ({
            ...d,
            clubs: d.clubs.map((c) => (c.id === clubId ? { ...c, ...patch } : c)),
          }),
          () =>
            db.updateClub(clubId, {
              ...(patch.description !== undefined && { description: patch.description }),
              ...(patch.themeColor !== undefined && { theme_color: patch.themeColor }),
              ...(patch.bannerUrl !== undefined && { banner_url: patch.bannerUrl }),
            }),
        ),

      setClubOfficers: (clubId: string, presidentId: string | null, vpId: string | null) => {
        const officers = [presidentId, vpId].filter((v): v is string => Boolean(v));
        mutate(
          (d) => {
            const others = d.clubMembers.filter((m) => m.clubId !== clubId);
            const existing = d.clubMembers.filter((m) => m.clubId === clubId);
            return {
              ...d,
              clubs: d.clubs.map((c) => (c.id === clubId ? { ...c, presidentId, vpId } : c)),
              clubMembers: [
                ...others,
                ...existing
                  .filter((m) => !officers.includes(m.userId))
                  .map((m) => (m.role === "officer" ? { ...m, role: "member" as const } : m)),
                ...officers.map((userId) => {
                  const already = existing.find((m) => m.userId === userId);
                  return {
                    clubId,
                    userId,
                    status: "accepted" as const,
                    role: "officer" as const,
                    invitedById: already?.invitedById ?? null,
                  };
                }),
              ],
            };
          },
          async () => {
            await db.updateClub(clubId, { president_id: presidentId, vp_id: vpId });
            await db.upsertMembers(
              officers.map((userId) => ({
                club_id: clubId,
                user_id: userId,
                status: "accepted",
                role: "officer",
              })),
            );
          },
        );
      },

      deleteClub: (clubId: string) =>
        mutate(
          (d) => ({
            ...d,
            clubs: d.clubs.filter((c) => c.id !== clubId),
            clubMembers: d.clubMembers.filter((m) => m.clubId !== clubId),
            posts: d.posts.filter((p) => p.clubId !== clubId),
          }),
          () => db.deleteClub(clubId),
        ),

      inviteToClub: (clubId: string, userId: string) => {
        const invitedById = state.currentUserId;
        mutate(
          (d) => {
            if (d.clubMembers.some((m) => m.clubId === clubId && m.userId === userId)) return d;
            return {
              ...d,
              clubMembers: [
                ...d.clubMembers,
                { clubId, userId, status: "invited", role: "member", invitedById },
              ],
            };
          },
          () =>
            db.upsertMembers([
              {
                club_id: clubId,
                user_id: userId,
                status: "invited",
                role: "member",
                invited_by_id: invitedById,
              },
            ]),
        );
      },

      respondToInvite: (clubId: string, accept: boolean) => {
        const userId = state.currentUserId;
        mutate(
          (d) => ({
            ...d,
            clubMembers: accept
              ? d.clubMembers.map((m) =>
                  m.clubId === clubId && m.userId === userId
                    ? { ...m, status: "accepted" as const }
                    : m,
                )
              : d.clubMembers.filter((m) => !(m.clubId === clubId && m.userId === userId)),
          }),
          () =>
            accept
              ? db.upsertMembers([
                  { club_id: clubId, user_id: userId, status: "accepted", role: "member" },
                ])
              : db.deleteMember(clubId, userId),
        );
      },

      leaveClub: (clubId: string) => {
        const userId = state.currentUserId;
        mutate(
          (d) => ({
            ...d,
            clubMembers: d.clubMembers.filter(
              (m) => !(m.clubId === clubId && m.userId === userId),
            ),
          }),
          () => db.deleteMember(clubId, userId),
        );
      },

      addCouncilMember: (userId: string, role: CouncilSeat, bio: string) => {
        const person = state.users.find((u) => u.id === userId);
        mutate(
          (d) => ({
            ...d,
            users: d.users.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    role: u.role === "student" ? ("council" as const) : u.role,
                    bio: u.bio?.trim() ? u.bio : bio.slice(0, BIO_MAX),
                  }
                : u,
            ),
            council: [
              ...d.council
                .filter((c) => c.userId !== userId)
                .map((c) =>
                  (role === "president" || role === "vice-president") && c.role === role
                    ? { ...c, role: "member" as const }
                    : c,
                ),
              { userId, role },
            ],
          }),
          async () => {
            const patch: Record<string, unknown> = {};
            if (person?.role === "student") patch.role = "council";
            if (!person?.bio?.trim() && bio.trim()) patch.bio = bio.slice(0, BIO_MAX);
            if (Object.keys(patch).length > 0) await db.updateUser(userId, patch);
            await db.setCouncilSeat(userId, role);
          },
        );
      },

      removeCouncilMember: (userId: string) =>
        mutate(
          (d) => ({
            ...d,
            council: d.council.filter((c) => c.userId !== userId),
            users: d.users.map((u) =>
              u.id === userId && u.role === "council" ? { ...u, role: "student" } : u,
            ),
          }),
          async () => {
            await db.removeCouncilSeat(userId);
            await db.updateUser(userId, { role: "student" });
          },
        ),
    }),
    [mutate, update, reset, state],
  );
}
