"use client";

import { PostCard } from "@/components/PostCard";
import { PostComposer } from "@/components/PostComposer";
import { EmptyState, PageHead } from "@/components/ui";
import { Reveal } from "@/components/Motion";
import { useDemo } from "@/demo/store";
import { canPostToMainForum, feed } from "@/demo/selectors";

export default function MainForumPage() {
  const { state, me } = useDemo();
  const posts = feed(state, null);
  const mayPost = canPostToMainForum(state, me);

  return (
    <>
      <PageHead
        label="The board"
        title="Announcements"
        lede="Posted by the student council and school admin. Everyone gets a say with a reaction."
      />

      {mayPost ? (
        <PostComposer clubId={null} placeholder="Post an announcement…" />
      ) : (
        <p className="mb-6 rounded-[10px] border border-line bg-surface/60 px-4 py-3 text-sm text-subtle">
          The council president, vice president and admin post here. You can react to
          anything on the feed.
        </p>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <EmptyState>No announcements yet.</EmptyState>
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
  );
}
