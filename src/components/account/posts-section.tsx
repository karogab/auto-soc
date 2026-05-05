"use client";

import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { PostText } from "@/components/post-text";
import { CreatePostForm } from "@/components/account/create-post-form";
import { DeleteMyPostForm } from "@/components/delete-my-post-form";
import type { PostStatus } from "@prisma/client";

export type AccountMyPost = {
  id: string;
  text: string;
  status: PostStatus;
  createdAt: Date;
};

export function PostsSection({ myPosts }: { myPosts: AccountMyPost[] }) {
  return (
    <div className="space-y-8">
      <CreatePostForm />

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">My posts</h2>
        {myPosts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">You have no posts yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {myPosts.map((p) => (
              <li key={p.id} className="rounded border border-zinc-100 p-3 dark:border-zinc-800">
                <PostText text={p.text} />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-zinc-500">
                    Status: {p.status} · {formatDateTimeUtcPlus4(p.createdAt)}
                  </p>
                  <DeleteMyPostForm postId={p.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
