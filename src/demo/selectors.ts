import type {
  Club,
  ClubMember,
  CouncilSeat,
  DemoState,
  Event,
  Post,
  PostStatus,
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

/**
 * Newest first. `clubId` of null is the main forum.
 *
 * Only published posts. A club member's submission sits in the review queue
 * until an officer rules on it, and a denied one never appears here at all —
 * its author sees the outcome on the club's Review tab instead.
 */
export function feed(state: DemoState, clubId: string | null): FeedPost[] {
  return state.posts
    .filter((p) => p.clubId === clubId && p.status === "published")
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

/** An accepted member of this club — officers included. */
export function isClubMember(state: DemoState, club: Club, user: User): boolean {
  return state.clubMembers.some(
    (m) => m.clubId === club.id && m.userId === user.id && m.status === "accepted",
  );
}

/**
 * Who may write into a club at all: its officers, and any accepted member.
 *
 * The two are not the same act. An officer's post is published on the spot; a
 * member's is a submission that an officer has to pass. `postStatusFor` is the
 * single place that difference is decided, so no caller can accidentally
 * publish something that should have been reviewed.
 */
export function canSubmitToClub(state: DemoState, club: Club, user: User): boolean {
  return isClubOfficer(state, club, user) || isClubMember(state, club, user);
}

export function postStatusFor(
  state: DemoState,
  clubId: string | null,
  user: User,
): PostStatus {
  if (clubId === null) return "published";
  const club = state.clubs.find((c) => c.id === clubId);
  if (!club) return "published";
  return isClubOfficer(state, club, user) ? "published" : "pending";
}

export function canReviewPosts(state: DemoState, club: Club, user: User): boolean {
  return isClubOfficer(state, club, user);
}

export type Submission = Post & { author: User | null; reviewedBy: User | null };

/**
 * The club's Review tab.
 *
 * Everyone in the club gets the tab, but an ordinary member only ever sees
 * their own submissions — both the ones still waiting and the ones already
 * ruled on. Officers see the whole queue. Filtering here rather than in the
 * component means one rule serves the list, its counts and its empty state.
 *
 * An approved post stays on the list rather than vanishing into the feed: the
 * author needs to see that their submission was accepted, not just guess it
 * from the feed. `reviewedById` is what distinguishes it from a post an
 * officer published directly, which was never reviewed by anyone.
 */
export function reviewQueue(state: DemoState, club: Club, user: User): Submission[] {
  const all = canReviewPosts(state, club, user);

  return state.posts
    .filter(
      (p) =>
        p.clubId === club.id && (p.status !== "published" || p.reviewedById !== null),
    )
    .filter((p) => all || p.authorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((post) => ({
      ...post,
      author: userById(state, post.authorId),
      reviewedBy: post.reviewedById ? userById(state, post.reviewedById) : null,
    }));
}

/** What the Review tab's badge counts: submissions still waiting on someone. */
export function awaitingReview(state: DemoState, club: Club, user: User): number {
  return reviewQueue(state, club, user).filter((p) => p.status === "pending").length;
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

/**
 * The clubs a person is actually in, for their badges in the directory, with
 * the seat they hold in each. Invitations they have not accepted do not count.
 */
export function clubBadges(
  state: DemoState,
  userId: string,
): Array<{ club: Club; seat: "President" | "Vice President" | "Member" }> {
  return state.clubs
    .filter((club) =>
      state.clubMembers.some(
        (m) => m.clubId === club.id && m.userId === userId && m.status === "accepted",
      ),
    )
    .map((club) => ({
      club,
      seat:
        club.presidentId === userId
          ? ("President" as const)
          : club.vpId === userId
            ? ("Vice President" as const)
            : ("Member" as const),
    }));
}

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  council: "Student Council",
  admin: "Admin",
};
