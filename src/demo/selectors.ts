import type {
  Club,
  ClubMember,
  CouncilSeat,
  DemoState,
  Event,
  Post,
  ReactionType,
  Role,
  User,
} from "./types";

/** A post with everything the card needs, already joined and counted. */
export type FeedPost = Post & {
  author: User | null;
  positive: number;
  negative: number;
  myReaction: ReactionType | null;
};

export function userById(state: DemoState, id: string): User | null {
  return state.users.find((u) => u.id === id) ?? null;
}

/** Newest first. `clubId` of null is the main forum. */
export function feed(state: DemoState, clubId: string | null): FeedPost[] {
  return state.posts
    .filter((p) => p.clubId === clubId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => {
      const mine = state.reactions.find(
        (r) => r.postId === post.id && r.userId === state.currentUserId,
      );
      return {
        ...post,
        author: userById(state, post.authorId),
        positive: state.reactions.filter((r) => r.postId === post.id && r.type === "positive").length,
        negative: state.reactions.filter((r) => r.postId === post.id && r.type === "negative").length,
        myReaction: mine?.type ?? null,
      };
    });
}

export function clubBySlug(state: DemoState, slug: string): Club | null {
  return state.clubs.find((c) => c.slug === slug) ?? null;
}

export type Roster = {
  president: User | null;
  vp: User | null;
  members: User[];
  pending: Array<{ user: User; invitedBy: User | null }>;
};

export function roster(state: DemoState, club: Club): Roster {
  const accepted = state.clubMembers.filter(
    (m) => m.clubId === club.id && m.status === "accepted",
  );
  const leaders = new Set(
    [club.presidentId, club.vpId].filter((id): id is string => Boolean(id)),
  );

  return {
    president: club.presidentId ? userById(state, club.presidentId) : null,
    vp: club.vpId ? userById(state, club.vpId) : null,
    members: accepted
      .filter((m) => !leaders.has(m.userId))
      .map((m) => userById(state, m.userId))
      .filter((u): u is User => u !== null),
    pending: state.clubMembers
      .filter((m) => m.clubId === club.id && m.status === "invited")
      .map((m) => ({ user: userById(state, m.userId), invitedBy: userById(state, m.invitedById ?? "") }))
      .filter((entry): entry is { user: User; invitedBy: User | null } => entry.user !== null),
  };
}

/** President + VP + members, counting only seats that are actually filled. */
export function rosterSize(people: Roster): number {
  return people.members.length + (people.president ? 1 : 0) + (people.vp ? 1 : 0);
}

export function membership(state: DemoState, clubId: string, userId: string): ClubMember | null {
  return state.clubMembers.find((m) => m.clubId === clubId && m.userId === userId) ?? null;
}

/** Clubs the given person has accepted, for their profile page. */
export function clubsOf(state: DemoState, userId: string): Club[] {
  return state.clubs.filter((club) =>
    state.clubMembers.some(
      (m) => m.clubId === club.id && m.userId === userId && m.status === "accepted",
    ),
  );
}

export function pendingInvites(state: DemoState, userId: string): Array<{ club: Club; from: User | null }> {
  return state.clubMembers
    .filter((m) => m.userId === userId && m.status === "invited")
    .map((m) => ({
      club: state.clubs.find((c) => c.id === m.clubId) ?? null,
      from: userById(state, m.invitedById ?? ""),
    }))
    .filter((entry): entry is { club: Club; from: User | null } => entry.club !== null);
}

/* -------------------------------------------------------------- permissions */

/** Which council seat this person holds, if any. */
export function councilSeat(state: DemoState, userId: string): CouncilSeat | null {
  return state.council.find((c) => c.userId === userId)?.role ?? null;
}

/**
 * Posting and running events belong to the council's two officers, not to the
 * whole council. A plain council member is a student with one extra privilege:
 * they can see the student directory. They cannot announce or schedule.
 */
function isCouncilOfficer(state: DemoState, user: User): boolean {
  const seat = councilSeat(state, user.id);
  return seat === "president" || seat === "vice-president";
}

export function canPostToMainForum(state: DemoState, user: User): boolean {
  return user.role === "admin" || isCouncilOfficer(state, user);
}

export function canManageEvents(state: DemoState, user: User): boolean {
  return user.role === "admin" || isCouncilOfficer(state, user);
}

/**
 * A club's President and VP run it — plus Admin, who can act anywhere. Council
 * membership grants nothing here unless they also hold a club office.
 */
export function isClubOfficer(state: DemoState, club: Club, user: User): boolean {
  if (user.role === "admin") return true;
  // A vacant seat is null, which must never match a real user id.
  return (
    (club.presidentId !== null && club.presidentId === user.id) ||
    (club.vpId !== null && club.vpId === user.id)
  );
}

/**
 * Clubs this person may invite someone into.
 *
 * Admin and the council's president and vice-president cover every club, since
 * they run the club list itself. A club's own president or VP covers only the
 * clubs where they hold a seat. Everyone else gets nothing, which is also what
 * hides the directory from them.
 */
export function clubsICanInviteTo(state: DemoState, user: User): Club[] {
  if (user.role === "admin") return state.clubs;
  if (isCouncilOfficer(state, user)) return state.clubs;

  return state.clubs.filter((club) => club.presidentId === user.id || club.vpId === user.id);
}

/**
 * Who may open the student directory.
 *
 * Wider than who may invite: every council member can browse it, but a plain
 * member has no club to invite into, so they see the list without any invite
 * actions on it.
 */
export function canSeeDirectory(state: DemoState, user: User): boolean {
  return (
    user.role === "admin" ||
    councilSeat(state, user.id) !== null ||
    clubsICanInviteTo(state, user).length > 0
  );
}

/** Everyone, sorted A-Z and bucketed by the first letter of the display name. */
export function directoryByLetter(
  state: DemoState,
): Array<{ letter: string; people: User[] }> {
  const sorted = [...state.users].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  );

  const groups = new Map<string, User[]>();
  for (const person of sorted) {
    const first = person.displayName.trim().charAt(0).toUpperCase();
    // Anything outside A-Z (digits, symbols, other scripts) collects under #.
    const letter = /[A-Z]/.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), person]);
  }

  return [...groups.entries()].map(([letter, people]) => ({ letter, people }));
}


/** The signup list is the organizer's alone — and Admin's. */
export function canSeeSignups(event: Event, user: User): boolean {
  return event.createdBy === user.id || user.role === "admin";
}

export function signupsFor(state: DemoState, eventId: string): User[] {
  return state.eventSignups
    .filter((s) => s.eventId === eventId)
    .map((s) => userById(state, s.userId))
    .filter((u): u is User => u !== null);
}

export function isSignedUp(state: DemoState, eventId: string, userId: string): boolean {
  return state.eventSignups.some((s) => s.eventId === eventId && s.userId === userId);
}

/**
 * Exact-email lookup, the one place a real email is ever used. Returns display
 * identity only — never the email back, never a partial match, and never a
 * browsable list.
 */
export function findByEmail(state: DemoState, email: string): User | null {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  return state.users.find((u) => u.email.toLowerCase() === needle) ?? null;
}

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  council: "Student Council",
  admin: "Admin",
};
