"use client";

import { useActionState } from "react";
import { createPostAction } from "@/actions/posts";

export function CreatePostForm() {
  const [postState, postAction, postPending] = useActionState(createPostAction, undefined);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Create post</h2>
      <form action={postAction} className="mt-3 max-w-xl space-y-2">
        <textarea
          name="text"
          required
          rows={4}
          placeholder="Write your post..."
          className="w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
        {postState?.error ? <p className="text-sm text-rose-600">{postState.error}</p> : null}
        {postState?.ok ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Your post was sent to moderation.</p>
        ) : null}
        <button
          type="submit"
          disabled={postPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Send to moderation
        </button>
      </form>
    </div>
  );
}
