export type ProfileStatsAvatarProps = {
  approvedPostCount: number;
  approvedCommentCount: number;
};

export function ProfileStatsAvatar({
  approvedPostCount,
  approvedCommentCount,
}: ProfileStatsAvatarProps) {
  return (
    <div
      className="flex shrink-0 flex-col items-center gap-2"
      aria-label={`${approvedPostCount} approved posts, ${approvedCommentCount} comments on approved posts`}
    >
      <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
        <span className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {approvedPostCount}
        </span>
        <span className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          posts
        </span>
      </div>
      <p className="max-w-[10rem] text-center text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Comments</span>
        <span className="tabular-nums text-zinc-700 dark:text-zinc-300"> {approvedCommentCount}</span>
        <span className="block text-[0.65rem] font-normal normal-case tracking-normal text-zinc-500 dark:text-zinc-500">
          on approved posts
        </span>
      </p>
    </div>
  );
}
