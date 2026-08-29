"use client";

import { Avatar } from "@/components/Avatar";
import { ReactionBar } from "@/components/ReactionBar";
import { useState } from "react";

import { useActions } from "@/demo/store";
import { ConfirmDialog } from "@/components/Dialogs";
import { Linkify } from "@/components/Linkify";
import type { FeedPost } from "@/demo/selectors";

export function PostCard({ post, canDelete }: { post: FeedPost; canDelete: boolean }) {
  const { deletePost } = useActions();
  const [confirming, setConfirming] = useState(false);
  const author = post.author ?? { displayName: "Former student", pfpUrl: null };

  return (
    <article className="group rounded-2xl border border-line bg-surface/80 p-6 shadow-[0_1px_2px_rgba(20,40,30,0.04),0_10px_28px_-14px_rgba(20,40,30,0.12)] backdrop-blur-[2px] transition-colors hover:border-ink/25">
      <header className="flex items-center gap-3">
        <Avatar identity={author} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold tracking-tight">{author.displayName}</p>
          <PostedAt iso={post.createdAt} />
        </div>
        {canDelete ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-full px-2.5 py-1 text-xs text-subtle opacity-0 transition-opacity hover:bg-down-soft hover:text-down focus-visible:opacity-100 group-hover:opacity-100"
          >
            Delete
          </button>
        ) : null}
      </header>

      <h2 className="mt-5 text-balance font-display text-2xl leading-[1.02] sm:text-[28px]">
        {post.title}
      </h2>

      {/* Still plain text: Linkify only wraps matched URLs in <a> elements and
          inserts everything else as React text nodes, so a post cannot inject
          markup into anyone else's page. */}
      <p className="mt-3 max-w-[62ch] whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink/85">
        <Linkify text={post.content} />
      </p>

      {post.imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="max-h-[32rem] w-full object-cover" loading="lazy" />
        </div>
      ) : null}

      <footer className="mt-5 border-t border-line pt-4">
        <ReactionBar
          postId={post.id}
          positive={post.positive}
          negative={post.negative}
          myReaction={post.myReaction}
        />
      </footer>

      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        body={`“${post.title}” and every reaction on it will be removed.`}
        confirmLabel="Delete post"
        onConfirm={() => deletePost(post.id)}
        onClose={() => setConfirming(false)}
      />
    </article>
  );
}

function PostedAt({ iso }: { iso: string }) {
  const date = new Date(iso);
  return (
    <time dateTime={iso} className="text-xs text-subtle">
      {date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}
    </time>
  );
}
