"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Avatar, PersonRow } from "@/components/Avatar";
import { ClubBackdrop } from "@/components/ClubBackdrop";
import { ClubMasthead, ClubTabs } from "@/components/ClubMasthead";
import { InviteTool } from "@/components/InviteTool";
import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { ReviewQueue } from "@/components/ReviewQueue";
import { Button, Card, EmptyState, Field, TextArea } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import {
  awaitingReview,
  canSubmitToClub,
  clubBySlug,
  feed,
  isClubMember,
  isClubOfficer,
  membership,
  roster,
  rosterSize,
} from "@/demo/selectors";
import { CLUB_COLORS } from "@/demo/initial";
import { Reveal, Swap } from "@/components/Motion";
import { PersonCard } from "@/components/PersonCard";
import { ProfileDialog } from "@/components/Dialogs";
import type { Club } from "@/demo/types";

const TABS = ["feed", "review", "members", "about"] as const;
type Tab = (typeof TABS)[number];

export default function ClubPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state, me } = useDemo();
  const { respondToInvite, leaveClub } = useActions();
  const [tab, setTab] = useState<Tab>("feed");
  const [editing, setEditing] = useState(false);

  const club = clubBySlug(state, slug);
  if (!club) {
    return (
      <EmptyState>
        No such club.{" "}
        <Link href="/clubs" className="text-brand underline underline-offset-4">
          Back to clubs
        </Link>
      </EmptyState>
    );
  }

  const officer = isClubOfficer(state, club, me);
  const holdsSeat = club.presidentId === me.id || club.vpId === me.id;
  const mine = membership(state, club.id, me.id);
  const posts = feed(state, club.id);
  const people = roster(state, club);
  const size = rosterSize(people);
  const canSubmit = canSubmitToClub(state, club, me);
  const inClub = isClubMember(state, club, me) || officer;
  const waiting = inClub ? awaitingReview(state, club, me) : 0;

  return (
    <>
      {/* The whole page sits on the club's own artwork. */}
      <ClubBackdrop club={club} />

      <Link href="/clubs" className="mb-4 inline-block text-sm text-subtle hover:text-ink">
        ← Clubs
      </Link>

      <ClubMasthead
        club={club}
        president={people.president}
        memberCount={size}
        officerCount={(people.president ? 1 : 0) + (people.vp ? 1 : 0)}
        postCount={posts.length}
        action={
          officer ? (
            <span
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-white"
              style={{ background: club.themeColor }}
            >
              {/* Admins can act here without holding a seat; say which it is. */}
              {holdsSeat ? "You run this club" : "Admin access"}
            </span>
          ) : mine?.status === "accepted" ? (
            <Button variant="ghost" onClick={() => leaveClub(club.id)}>
              Leave club
            </Button>
          ) : null
        }
      />

      {mine?.status === "invited" ? (
        <Card className="mt-6">
          <p className="text-sm font-medium">You&apos;ve been invited to {club.name}.</p>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => respondToInvite(club.id, true)}>Accept</Button>
            <Button variant="ghost" onClick={() => respondToInvite(club.id, false)}>
              Decline
            </Button>
          </div>
        </Card>
      ) : null}

      <ClubTabs
        tabs={[
          { id: "feed", label: "Feed", count: posts.length },
          // The tab is for people inside the club; there is nothing on it for
          // anyone else, and its count would leak the queue's size.
          ...(inClub ? [{ id: "review" as const, label: "Review", count: waiting }] : []),
          { id: "members", label: "Members", count: size },
          { id: "about", label: "About" },
        ]}
        active={tab}
        accent={club.themeColor}
        onSelect={setTab}
      />

      <div className="mt-7">
        <Swap swapKey={tab}>
        {tab === "feed" ? (
          <>
            {canSubmit ? (
              <PostComposer
                clubId={club.id}
                needsReview={!officer}
                placeholder={
                  officer ? `Post to ${club.name}…` : `Suggest a post for ${club.name}…`
                }
              />
            ) : (
              <p className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-subtle">
                Join {club.name} to write here. Members submit posts for the
                president and VP to review; officers publish directly.
              </p>
            )}

            <div className="space-y-4">
              {posts.length === 0 ? (
                <EmptyState>No posts in this club yet.</EmptyState>
              ) : (
                posts.map((post, index) => (
                  <Reveal key={post.id} index={index}>
                    <PostCard
                      post={post}
                      canDelete={post.authorId === me.id || me.role === "admin"}
                    />
                  </Reveal>
                ))
              )}
            </div>
          </>
        ) : null}

        {tab === "review" ? (inClub ? <ReviewQueue club={club} /> : null) : null}

        {tab === "members" ? (
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
                Officers
              </h2>
              {people.president || people.vp ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {people.president ? (
                    <PersonCard
                      person={people.president}
                      seat="President"
                      accent={club.themeColor}
                      onEdit={people.president.id === me.id ? () => setEditing(true) : undefined}
                    />
                  ) : null}
                  {people.vp ? (
                    <PersonCard
                      person={people.vp}
                      seat="Vice President"
                      accent={club.themeColor}
                      onEdit={people.vp.id === me.id ? () => setEditing(true) : undefined}
                    />
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-subtle">
                  No president or VP yet. An admin appoints them in the About tab.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
                Members ({people.members.length})
              </h2>
              {people.members.length === 0 ? (
                <p className="text-sm text-subtle">No members yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {people.members.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                      accent={club.themeColor}
                      onEdit={person.id === me.id ? () => setEditing(true) : undefined}
                    />
                  ))}
                </div>
              )}
            </section>

            {officer ? (
              <>
                {people.pending.length > 0 ? (
                  <section>
                    <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
                      Awaiting a reply ({people.pending.length})
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {people.pending.map(({ user }) => (
                        <div key={user.id} className="opacity-60">
                          <PersonCard person={user} seat="Invited" accent={club.themeColor} />
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <InviteTool club={club} />
              </>
            ) : null}
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="space-y-4">
            {officer ? (
              <ClubEditor club={club} />
            ) : (
              <Card>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
                  {club.description}
                </p>
              </Card>
            )}
            {me.role === "admin" ? <OfficerAssigner club={club} /> : null}
          </div>
        ) : null}
        </Swap>
      </div>

      <ProfileDialog open={editing} person={me} onClose={() => setEditing(false)} />
    </>
  );
}

/** President/VP customization: description and theme colour. */
function ClubEditor({ club }: { club: Club }) {
  const { updateClub } = useActions();
  const [description, setDescription] = useState(club.description);
  const saved = description === club.description;

  return (
    <Card className="space-y-5">
      <Field label="Description" hint="Shown on the club card and this page.">
        <TextArea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div>
        <span className="mb-2 block text-sm font-medium">Theme colour</span>
        <div className="flex flex-wrap gap-2">
          {CLUB_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color}`}
              onClick={() => updateClub(club.id, { themeColor: color })}
              className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-[var(--color-surface)] transition ${
                club.themeColor === color ? "ring-2 ring-ink" : "ring-1 ring-line"
              }`}
              style={{ background: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={saved}
          onClick={() => updateClub(club.id, { description: description.trim() })}
        >
          {saved ? "Saved" : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Admin only. The clubs ship with vacant seats, so there has to be a way to
 * hand one to a student — that is what makes them an officer.
 */
function OfficerAssigner({ club }: { club: Club }) {
  const { state } = useDemo();
  const { setClubOfficers } = useActions();
  const [presidentId, setPresidentId] = useState(club.presidentId ?? "");
  const [vpId, setVpId] = useState(club.vpId ?? "");

  const dirty = presidentId !== (club.presidentId ?? "") || vpId !== (club.vpId ?? "");
  const select =
    "w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none";

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Officers</p>
        <p className="mt-1 text-xs text-subtle">
          Admin only. Whoever holds a seat can post to this club and invite members.
        </p>
      </div>

      {state.users.length === 0 ? (
        <p className="text-sm text-subtle">Add some accounts first.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="President">
              <select
                value={presidentId}
                onChange={(e) => setPresidentId(e.target.value)}
                className={select}
              >
                <option value="">- vacant -</option>
                {state.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Vice President">
              <select value={vpId} onChange={(e) => setVpId(e.target.value)} className={select}>
                <option value="">- vacant -</option>
                {state.users
                  .filter((user) => user.id !== presidentId)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!dirty}
              onClick={() => setClubOfficers(club.id, presidentId || null, vpId || null)}
            >
              {dirty ? "Save officers" : "Saved"}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
