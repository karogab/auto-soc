"use client";

import { adminDeletePostAction } from "@/actions/posts";

type AdminDeletePostFormProps = {
  postId: string;
};

export function AdminDeletePostForm({ postId }: AdminDeletePostFormProps) {
  return (
    <form
      action={adminDeletePostAction}
      className="inline"
      onSubmit={(e) => {
        if (!window.confirm("Delete this post permanently (any status)?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="postId" value={postId} />
      <button
        type="submit"
        className="text-sm font-medium text-rose-700 underline decoration-rose-400/60 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300"
      >
        Delete
      </button>
    </form>
  );
}
