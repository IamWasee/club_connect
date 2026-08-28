/**
 * Demo data model.
 *
 * Deliberately mirrors the shape the real database will have, so swapping the
 * in-memory store for a backend later is a change of data source, not a change
 * of component props.
 */

export type Role = "student" | "council" | "admin";

/** The only way a person is ever shown: picture + display name. */
export type User = {
  id: string;
  displayName: string;
  pfpUrl: string | null;
  role: Role;
  /** Private in the real app; here only the officer search reads it. */
  email: string;
  /** Shown on the person's card. Kept to the spec's 100-character cap. */
  bio?: string;
  /** Handles, stored without the @ or any host. */
  instagram?: string;
  facebook?: string;
  /**
   * A contact address the person chooses to publish. Deliberately separate
   * from `email`, which is the private one they signed in with and is never
   * shown to anyone.
   */
  publicEmail?: string;
  /**
   * "What I do" on the council. Only meaningful for the `member` seat: the
   * president and vice-president have titles that already say it.
   */
  contribution?: string;
};

export const CONTRIBUTION_MAX = 80;

export const BIO_MAX = 100;

export type ReactionType = "positive" | "negative";

export type Post = {
  id: string;
  authorId: string;
  /** null = main forum. */
  clubId: string | null;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
};

export type Reaction = {
  postId: string;
  userId: string;
  type: ReactionType;
};

export type ClubMemberStatus = "invited" | "accepted";
export type ClubMemberRole = "member" | "officer";

export type ClubMember = {
  clubId: string;
  userId: string;
  status: ClubMemberStatus;
  role: ClubMemberRole;
  /** Who sent the invite — shown on the invited student's profile. */
  invitedById: string | null;
};

/** Which motif `ClubArt` draws for the club's banner and badge. */
export type ClubPattern =
  | "field"
  | "podium"
  | "filmstrip"
  | "grid"
  | "circuit"
  | "leaves"
  | "waves"
  | "confetti";

export type Club = {
  id: string;
  slug: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  themeColor: string;
  pattern: ClubPattern;
  /** Null while the seat is vacant — a club can exist before it has officers. */
  presidentId: string | null;
  vpId: string | null;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  /** ISO date-time the event starts. */
  date: string;
  /** ISO date-time it ends. Always after `date`; a calendar needs a duration. */
  endDate: string;
  /** All-day events sit in the band above the hour grid, as in Google Calendar. */
  allDay: boolean;
  /** Hex from `EVENT_COLORS`. Purely cosmetic, chosen when the event is made. */
  color: string;
  location: string;
  imageUrl: string | null;
  createdBy: string;
};

export type EventSignup = {
  eventId: string;
  userId: string;
};

export type CouncilSeat = "president" | "vice-president" | "member";

export type CouncilMember = {
  userId: string;
  role: CouncilSeat;
  /**
   * Legacy. The blurb now lives on the user's own profile so one edit updates
   * their council card and every club roster they appear on. Kept only so old
   * saves can be migrated forward.
   */
  bio?: string;
};

export type DemoState = {
  users: User[];
  clubs: Club[];
  clubMembers: ClubMember[];
  posts: Post[];
  reactions: Reaction[];
  events: Event[];
  eventSignups: EventSignup[];
  council: CouncilMember[];
  /** Who you are "signed in" as. The demo swaps this instead of authenticating. */
  currentUserId: string;
  /** Presentation revision of the starter clubs this save has been brought to. */
  starterRev?: string;
};
