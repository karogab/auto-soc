"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCommentAction } from "@/actions/comments";

type CommentFormProps = {
  postId: string;
  parentCommentId?: string;
  placeholder?: string;
  submitLabel?: string;
  onSuccess?: () => void;
};

export function CommentForm({
  postId,
  parentCommentId,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  onSuccess,
}: CommentFormProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createCommentAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    }
  }, [state?.ok, router, onSuccess]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="postId" value={postId} />
      {parentCommentId ? (
        <input type="hidden" name="parentCommentId" value={parentCommentId} />
      ) : null}
      <textarea
        name="text"
        required
        rows={3}
        placeholder={placeholder}
        className="w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
      />
      {state?.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
