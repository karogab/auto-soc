import Link from "next/link";
import type { FeedSortMode } from "@/server/posts";

type FeedSortTabsProps = {
  active: FeedSortMode;
  recentHref: string;
  popularHref: string;
};

export function FeedSortTabs({ active, recentHref, popularHref }: FeedSortTabsProps) {
  const base = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  const inactive =
    "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900";
  const activeCls = "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sort posts">
      <Link
        href={recentHref}
        className={`${base} ${active === "recent" ? activeCls : inactive}`}
        role="tab"
        aria-selected={active === "recent"}
      >
        Latest
      </Link>
      <Link
        href={popularHref}
        className={`${base} ${active === "popular" ? activeCls : inactive}`}
        role="tab"
        aria-selected={active === "popular"}
      >
        Most liked
      </Link>
    </div>
  );
}
