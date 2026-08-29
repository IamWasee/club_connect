"use client";

import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { ConfirmDialog } from "@/components/Dialogs";
import { Linkify } from "@/components/Linkify";
import { Button, EmptyState } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { canReviewPosts, reviewQueue } from "@/demo/selectors";
import type { Submission } from "@/demo/selectors";
import type { Club } from "@/demo/types";

/**
 * A club's Review tab.
 *
 * Every member of the club can open it, but what they see differs: an officer
 * gets the whole queue and the two buttons that settle it, a member gets only
 * their own submissions and no buttons at all. That split is decided in
 * `reviewQueue`, not here, so the list, the counts and the empty state can
 * never disagree about who is allowed to see what.
 */
export function ReviewQueue({ club }: { club: Club }) {
  const { state, me } = useDemo();
  const canReview = canReviewPosts(state, club, me);
  const items = reviewQueue(state, club, me);

  const waiting = items.filter((p) => p.status === "pending");
  const settled = items.filter((p) => p.status !== "pending");

  if (items.length === 0) {
    return (
      <EmptyState>
        {canReview
          ? "Nothing waiting. Posts written by members of this club land here before they reach the feed."
          : "You have not submitted anything to this club yet. Write a post and it will show up here while an officer reads it."}
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-line bg-surface/70 px-4 py-3 text-sm text-subtle">
        {canReview
          ? "Members' posts wait here until you approve or deny them. Approving publishes to the club feed straight away."
          : "Your submissions to this club. Only you and the club's president and vice president can see them."}
      </p>

      <Section
        title={canReview ? `In review (${waiting.length})` : `Your posts in review (${waiting.length})`}
        items={waiting}
        canReview={canReview}
        empty="Nothing waiting right now."
      />

      {settled.length > 0 ? (
        <Section
          title={`After review (${settled.length})`}
          items={settled}
          canReview={canReview}
        />
      ) : null}
    </div>
  );
}

function Section({
  title,
  items,
  canReview,
  empty,
}: {
  title: string;
  items: Submission[];
  canReview: boolean;
  empty?: string;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
        {title}
      </h3>
      {items.length === 0 ? (
        empty ? (
          <p className="text-sm text-subtle">{empty}</p>
        ) : null
      ) : (
        <ul className="space-y-4">
          {items.map((post) => (
            <li key={post.id}>
              <SubmissionCard post={post} canReview={canReview} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS = {
  pending: { label: "In review", className: "border-line bg-surface text-subtle" },
  denied: { label: "Not approved", className: "border-down/40 bg-down-soft text-down" },
  published: { label: "Published", className: "border-brand/40 bg-brand-soft text-brand" },
} as const;

function SubmissionCard({ post, canReview }: { post: Submission; canReview: boolean }) {
  const { reviewPost, deletePost } = useActions();
  const [denying, setDenying] = useState(false);
  const author = post.author ?? { displayName: "Former student", pfpUrl: null };
  const tone = STATUS[post.status];

  return (
    <article className="rounded-2xl border border-line bg-surface/80 p-5 shadow-[0_1px_2px_rgba(20,40,30,0.04)] backdrop-blur-[2px]">
      <header className="flex items-center gap-3">
        <Avatar identity={author} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight">
            {author.displayName}
          </p>
          <time dateTime={post.createdAt} className="text-xs text-subtle">
            {new Date(post.createdAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone.className}`}
        >
          {tone.label}
        </span>
      </header>

      <h4 className="mt-4 text-balance font-display text-xl leading-tight">{post.title}</h4>
      <p className="mt-2 max-w-[62ch] whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink/85">
        <Linkify text={post.content} />
      </p>

      {post.imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-80 w-full object-cover"
          />
        </div>
      ) : null}

      {post.status !== "pending" && post.reviewedBy ? (
        <p className="mt-4 border-t border-line pt-3 text-xs text-subtle">
          {post.status === "denied" ? "Denied" : "Approved"} by {post.reviewedBy.displayName}
          {post.reviewedAt
            ? ` on ${new Date(post.reviewedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}`
            : ""}
        </p>
      ) : null}

      {canReview && post.status === "pending" ? (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button variant="danger" onClick={() => setDenying(true)}>
            Deny
          </Button>
          <Button onClick={() => reviewPost(post.id, true)}>Approve &amp; publish</Button>
        </div>
      ) : null}

      {canReview && post.status === "denied" ? (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={() => deletePost(post.id)}>
            Remove from the list
          </Button>
          <Button variant="ghost" onClick={() => reviewPost(post.id, true)}>
            Change your mind — publish it
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={denying}
        title="Deny this post?"
        body={`“${post.title}” will not reach the club feed. ${author.displayName} keeps a record of the decision on their own Review tab.`}
        confirmLabel="Deny post"
        onConfirm={() => reviewPost(post.id, false)}
        onClose={() => setDenying(false)}
      />
    </article>
  );
}
