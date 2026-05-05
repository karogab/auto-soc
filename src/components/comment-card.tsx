"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { PostText } from "@/components/post-text";
import { VerifiedBadge } from "@/components/verified-badge";
import { CommentReactionButtons } from "@/components/comment-reaction-buttons";
import { ReportCommentButton } from "@/components/report-comment-button";
import { CommentPinForm } from "@/components/comment-pin-form";
import { CommentForm } from "@/components/comment-form";

export type CommentCardModel = {
  id: string;
  postId: string;
  text: string;
  pinnedOnPost: boolean;
  createdAt: Date;
  author: {
    firstName: string;
    lastName: string;
    username: string;
    isVerified: boolean;
  };
  targetUsername: string;
  likeCount: number;
  dislikeCount: number;
};

type CommentCardProps = {
  comment: CommentCardModel;
  myReaction: "like" | "dislike" | null;
  canPin: boolean;
};

export function CommentCard({ comment, myReaction, canPin }: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {comment.author.firstName} {comment.author.lastName}
            </span>
            <span>@{comment.author.username}</span>
            {comment.author.isVerified ? <VerifiedBadge aria-label="Verified" /> : null}
            <span aria-hidden>→</span>
            <span>@{comment.targetUsername}</span>
            <span className="text-xs text-zinc-500">{formatDateTimeUtcPlus4(comment.createdAt)}</span>
          </div>
          <PostText text={comment.text} />
          <CommentReactionButtons
            commentId={comment.id}
            likeCount={comment.likeCount}
            dislikeCount={comment.dislikeCount}
            myReaction={myReaction}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              className="text-sm text-zinc-600 underline decoration-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {replyOpen ? "Cancel" : "Reply"}
            </button>
            <ReportCommentButton commentId={comment.id} rootClassName="mt-0" />
          </div>
          {replyOpen ? (
            <div className="mt-2">
              <CommentForm
                postId={comment.postId}
                parentCommentId={comment.id}
                placeholder={`Reply to @${comment.author.username}...`}
                submitLabel="Reply"
                onSuccess={() => setReplyOpen(false)}
              />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1">
            {canPin ? (
              <CommentPinForm commentId={comment.id} isPinned={comment.pinnedOnPost} />
            ) : comment.pinnedOnPost ? (
              <span
                title="Pinned"
                aria-label="Pinned"
                className="inline-flex items-center text-amber-600 dark:text-amber-400"
              >
                <Pin className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
