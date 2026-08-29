"use client";

import { getSupabase } from "@/lib/supabase";
import { STARTER_CLUBS, createEmpty } from "@/demo/initial";
import type { DemoState } from "@/demo/types";

/**
 * Reading and writing the shared backend.
 *
 * The app keeps working against one in-memory `DemoState`, so this module's job
 * is to load every table into that shape and to push individual changes back.
 * Rows are snake_case in Postgres and camelCase in the app; the mapping happens
 * here and nowhere else.
 *
 * The dataset is one school, so `loadAll` fetches everything. That is a few
 * hundred rows at most, and it means a change anywhere can be reconciled by
 * refetching rather than by patching state by hand.
 */

const TABLES = [
  "users",
  "clubs",
  "club_members",
  "posts",
  "reactions",
  "events",
  "event_signups",
  "council",
] as const;

export type TableName = (typeof TABLES)[number];
export const REALTIME_TABLES = TABLES;

/** Everything the app needs, in the shape the components already read. */
export async function loadAll(): Promise<DemoState | null> {
  const db = getSupabase();
  if (!db) return null;

  const [users, clubs, members, posts, reactions, events, signups, council] =
    await Promise.all([
      db.from("users").select("*").order("display_name"),
      db.from("clubs").select("*").order("name"),
      db.from("club_members").select("*"),
      db.from("posts").select("*").order("created_at", { ascending: false }),
      db.from("reactions").select("*"),
      db.from("events").select("*").order("starts_at"),
      db.from("event_signups").select("*"),
      db.from("council").select("*"),
    ]);

  const failed = [users, clubs, members, posts, reactions, events, signups, council].find(
    (result) => result.error,
  );
  if (failed?.error) throw new Error(failed.error.message);

  const empty = createEmpty();

  return {
    ...empty,
    users: (users.data ?? []).map((r) => ({
      id: r.id,
      displayName: r.display_name,
      email: r.email,
      pfpUrl: r.pfp_url,
      role: r.role,
      bio: r.bio ?? undefined,
      instagram: r.instagram ?? undefined,
      facebook: r.facebook ?? undefined,
      publicEmail: r.public_email ?? undefined,
      contribution: r.contribution ?? undefined,
    })),
    clubs: (clubs.data ?? []).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description ?? "",
      bannerUrl: r.banner_url,
      themeColor: r.theme_color,
      pattern: r.pattern,
      presidentId: r.president_id,
      vpId: r.vp_id,
    })),
    clubMembers: (members.data ?? []).map((r) => ({
      clubId: r.club_id,
      userId: r.user_id,
      status: r.status,
      role: r.role,
      invitedById: r.invited_by_id,
    })),
    posts: (posts.data ?? []).map((r) => ({
      id: r.id,
      authorId: r.author_id,
      clubId: r.club_id,
      title: r.title,
      content: r.content,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      // Columns added with the review flow; a row written before it is live.
      status: r.status ?? "published",
      reviewedById: r.reviewed_by_id ?? null,
      reviewedAt: r.reviewed_at ?? null,
    })),
    reactions: (reactions.data ?? []).map((r) => ({
      postId: r.post_id,
      userId: r.user_id,
      type: r.type,
    })),
    events: (events.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      date: r.starts_at,
      endDate: r.ends_at,
      allDay: r.all_day,
      color: r.color,
      location: r.location ?? "",
      imageUrl: r.image_url,
      createdBy: r.created_by,
    })),
    eventSignups: (signups.data ?? []).map((r) => ({
      eventId: r.event_id,
      userId: r.user_id,
    })),
    council: (council.data ?? []).map((r) => ({ userId: r.user_id, role: r.role })),
    // Who this browser is acting as stays local; see the store.
    currentUserId: "",
  };
}

/**
 * The six clubs ship with the schema, but a project restored from a backup or
 * migrated by hand can end up without them. Cheap to make sure.
 */
export async function ensureStarterClubs(): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const { error } = await db.from("clubs").upsert(
    STARTER_CLUBS.map((club) => ({
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      theme_color: club.themeColor,
      pattern: club.pattern,
    })),
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ writes */

function client() {
  const db = getSupabase();
  if (!db) throw new Error("The backend is not configured.");
  return db;
}

/** Throws on failure so the caller can surface it rather than fail silently. */
async function run(query: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export const db = {
  async upsertUser(user: {
    id: string;
    displayName: string;
    email: string;
    pfpUrl: string | null;
    role: string;
    bio?: string;
    instagram?: string;
    facebook?: string;
    publicEmail?: string;
    contribution?: string;
  }) {
    await run(
      client()
        .from("users")
        .upsert({
          id: user.id,
          display_name: user.displayName,
          email: user.email.toLowerCase(),
          pfp_url: user.pfpUrl,
          role: user.role,
          bio: user.bio ?? null,
          instagram: user.instagram ?? null,
          facebook: user.facebook ?? null,
          public_email: user.publicEmail ?? null,
          contribution: user.contribution ?? null,
        }),
    );
  },

  async updateUser(id: string, patch: Record<string, unknown>) {
    await run(client().from("users").update(patch).eq("id", id));
  },

  async deleteUser(id: string) {
    // Foreign keys cascade, so posts, reactions, signups and memberships go
    // with the account and club seats are set null.
    await run(client().from("users").delete().eq("id", id));
  },

  async upsertClub(club: Record<string, unknown>) {
    await run(client().from("clubs").upsert(club));
  },

  async updateClub(id: string, patch: Record<string, unknown>) {
    await run(client().from("clubs").update(patch).eq("id", id));
  },

  async deleteClub(id: string) {
    await run(client().from("clubs").delete().eq("id", id));
  },

  async upsertMembers(rows: Array<Record<string, unknown>>) {
    if (rows.length === 0) return;
    await run(client().from("club_members").upsert(rows, { onConflict: "club_id,user_id" }));
  },

  async deleteMember(clubId: string, userId: string) {
    await run(
      client().from("club_members").delete().eq("club_id", clubId).eq("user_id", userId),
    );
  },

  async deleteClubMembersExcept(clubId: string, keepUserIds: string[]) {
    let query = client().from("club_members").delete().eq("club_id", clubId);
    if (keepUserIds.length > 0) query = query.not("user_id", "in", `(${keepUserIds.join(",")})`);
    await run(query);
  },

  async insertPost(post: Record<string, unknown>) {
    await run(client().from("posts").insert(post));
  },

  async deletePost(id: string) {
    await run(client().from("posts").delete().eq("id", id));
  },

  async setPostStatus(
    id: string,
    status: string,
    reviewedById: string,
    reviewedAt: string,
  ) {
    await run(
      client()
        .from("posts")
        .update({ status, reviewed_by_id: reviewedById, reviewed_at: reviewedAt })
        .eq("id", id),
    );
  },

  async setReaction(postId: string, userId: string, type: string) {
    await run(
      client()
        .from("reactions")
        .upsert({ post_id: postId, user_id: userId, type }, { onConflict: "post_id,user_id" }),
    );
  },

  async clearReaction(postId: string, userId: string) {
    await run(
      client().from("reactions").delete().eq("post_id", postId).eq("user_id", userId),
    );
  },

  async insertEvent(event: Record<string, unknown>) {
    await run(client().from("events").insert(event));
  },

  async deleteEvent(id: string) {
    await run(client().from("events").delete().eq("id", id));
  },

  async addSignup(eventId: string, userId: string) {
    await run(
      client()
        .from("event_signups")
        .upsert({ event_id: eventId, user_id: userId }, { onConflict: "event_id,user_id" }),
    );
  },

  async removeSignup(eventId: string, userId: string) {
    await run(
      client().from("event_signups").delete().eq("event_id", eventId).eq("user_id", userId),
    );
  },

  async setCouncilSeat(userId: string, role: string) {
    // The unique partial indexes allow only one president and one VP, so an
    // incoming officer displaces the current holder first.
    if (role === "president" || role === "vice-president") {
      await run(client().from("council").update({ role: "member" }).eq("role", role));
    }
    await run(
      client().from("council").upsert({ user_id: userId, role }, { onConflict: "user_id" }),
    );
  },

  async removeCouncilSeat(userId: string) {
    await run(client().from("council").delete().eq("user_id", userId));
  },

  async wipeEverything() {
    const c = client();
    // Order matters only for readability; the cascades would handle it anyway.
    for (const table of ["reactions", "event_signups", "posts", "events", "council", "club_members"] as const) {
      await run(c.from(table).delete().neq("user_id", " ").or("id.neq. "));
    }
    await run(c.from("users").delete().neq("id", " "));
    await run(c.from("clubs").update({ president_id: null, vp_id: null }).neq("id", " "));
  },
};
