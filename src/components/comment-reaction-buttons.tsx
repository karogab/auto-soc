"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reactToCommentAction } from "@/actions/comments";

type CommentReactionButtonsProps = {
  commentId: string;
  likeCount: number;
  dislikeCount: number;
  myReaction: "like" | "dislike" | null;
};

export function CommentReactionButtons({
  commentId,
  likeCount,
  dislikeCount,
  myReaction,
}: CommentReactionButtonsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onReact = (type: "like" | "dislike") => {
    start(async () => {
      await reactToCommentAction(commentId, type);
      router.refresh();
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 text-base leading-none">
      <button
        type="button"
        disabled={pending}
        onClick={() => onReact("like")}
        aria-label={`Like, ${likeCount}`}
        aria-pressed={myReaction === "like"}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors ${
          myReaction === "like"
            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/80"
            : "border-transparent text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        }`}
      >
        <span aria-hidden>👍</span>
        <span className="tabular-nums text-sm font-medium text-zinc-900 dark:text-zinc-50">{likeCount}</span>
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onReact("dislike")}
        aria-label={`Dislike, ${dislikeCount}`}
        aria-pressed={myReaction === "dislike"}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors ${
          myReaction === "dislike"
            ? "border-rose-600 bg-rose-50 dark:bg-rose-950/80"
            : "border-transparent text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
        }`}
      >
        <span aria-hidden>👎</span>
        <span className="tabular-nums text-sm font-medium text-zinc-900 dark:text-zinc-50">{dislikeCount}</span>
      </button>
    </div>
  );
}
