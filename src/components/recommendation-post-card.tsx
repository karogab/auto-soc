import type { ReactNode } from "react";
import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { PostText } from "@/components/post-text";
import { ReactionButtons } from "@/components/reaction-buttons";
import { ReportPostButton } from "@/components/report-post-button";
import { VerifiedBadge } from "@/components/verified-badge";
import { RecommendationsAdminPinForm } from "@/components/recommendations-admin-pin-form";

export type RecommendationPostCardModel = {
  id: string;
  text: string;
  approvedAt: Date | null;
  createdAt: Date;
  pinnedOnRecommendations: boolean;
  likeCount: number;
  dislikeCount: number;
  author: {
    firstName: string;
    lastName: string;
    username: string;
    isVerified: boolean;
  };
};

type RecommendationPostCardProps = {
  post: RecommendationPostCardModel;
  myReaction: "like" | "dislike" | null;
  isAdmin: boolean;
  showPinnedLabel?: boolean;
  /** Pin/Unpin only on `/recommendations`; keep false on user profiles. */
  canPinOnRecommendationsFeed?: boolean;
  /** Rendered inside the same bordered card below the post (e.g. comments). */
  children?: ReactNode;
};

export function RecommendationPostCard({
  post,
  myReaction,
  isAdmin,
  showPinnedLabel = false,
  canPinOnRecommendationsFeed = false,
  children,
}: RecommendationPostCardProps) {
  const when = post.approvedAt ?? post.createdAt;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            {showPinnedLabel ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                Pinned
              </span>
            ) : null}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {post.author.firstName} {post.author.lastName}
            </span>
            <span>@{post.author.username}</span>
            {post.author.isVerified ? <VerifiedBadge aria-label="Verified" /> : null}
            <span className="text-xs text-zinc-500">{formatDateTimeUtcPlus4(when)}</span>
          </div>
          <PostText text={post.text} />
          <ReactionButtons
            postId={post.id}
            likeCount={post.likeCount}
            dislikeCount={post.dislikeCount}
            myReaction={myReaction}
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex flex-row flex-wrap items-center justify-end gap-x-3 gap-y-1">
            <ReportPostButton postId={post.id} rootClassName="mt-0" />
            {isAdmin && canPinOnRecommendationsFeed ? (
              <RecommendationsAdminPinForm postId={post.id} isPinned={post.pinnedOnRecommendations} />
            ) : null}
          </div>
        </div>
      </div>
      {children ? <div className="mt-4 space-y-3">{children}</div> : null}
    </div>
  );
}
