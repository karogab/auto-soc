import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import {
  getCurrentUserReactionsForPosts,
  listApprovedPostsForAuthor,
  type FeedSortMode,
} from "@/server/posts";
import { getUserByUsernameNormalizedForPublic } from "@/server/users";
import { VerifiedBadge } from "@/components/verified-badge";
import { FeedSortTabs } from "@/components/feed-sort-tabs";
import { RecommendationPostCard } from "@/components/recommendation-post-card";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ sort?: string }>;
};

function parseFeedSort(raw: string | undefined): FeedSortMode {
  return raw === "popular" ? "popular" : "recent";
}

export default async function PublicUserProfilePage({ params, searchParams }: PageProps) {
  const session = await requireSession();
  const { username: usernameParam } = await params;
  const sp = await searchParams;
  const sort = parseFeedSort(sp.sort);

  const user = await getUserByUsernameNormalizedForPublic(usernameParam);
  if (!user) {
    notFound();
  }

  const posts = await listApprovedPostsForAuthor(user.id, { sort });
  const ids = posts.map((p) => p.id);
  const reactionMap = await getCurrentUserReactionsForPosts(session.user.id, ids);
  const isAdmin = session.user.role === "admin";

  const userPath = `/users/${encodeURIComponent(user.username)}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          @{user.username}
          {user.isVerified ? <VerifiedBadge className="ml-1.5" aria-label="Verified" /> : null}
        </p>
      </header>
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Posts</h2>
        <FeedSortTabs active={sort} recentHref={userPath} popularHref={`${userPath}?sort=popular`} />
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No public posts yet.</p>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <RecommendationPostCard
                  post={post}
                  myReaction={reactionMap.get(post.id) ?? null}
                  isAdmin={isAdmin}
                  canPinOnRecommendationsFeed={false}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
