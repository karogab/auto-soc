import { requireSession } from "@/lib/permissions";
import { listApprovedFeedPosts, getCurrentUserReactionsForPosts, type FeedSortMode } from "@/server/posts";
import { FeedSortTabs } from "@/components/feed-sort-tabs";
import { RecommendationPostCard } from "@/components/recommendation-post-card";

type PageProps = {
  searchParams: Promise<{ sort?: string }>;
};

function parseFeedSort(raw: string | undefined): FeedSortMode {
  return raw === "popular" ? "popular" : "recent";
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const sp = await searchParams;
  const sort = parseFeedSort(sp.sort);
  const posts = await listApprovedFeedPosts({ sort });
  const ids = posts.map((p) => p.id);
  const reactionMap = await getCurrentUserReactionsForPosts(session.user.id, ids);
  const isAdmin = session.user.role === "admin";

  const pinnedPost = posts.find((p) => p.pinnedOnRecommendations) ?? null;
  const feedPosts = pinnedPost ? posts.filter((p) => p.id !== pinnedPost.id) : posts;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Recommendations</h1>
      {pinnedPost ? (
        <RecommendationPostCard
          post={pinnedPost}
          myReaction={reactionMap.get(pinnedPost.id) ?? null}
          isAdmin={isAdmin}
          showPinnedLabel
          canPinOnRecommendationsFeed={isAdmin}
        />
      ) : null}
      <FeedSortTabs active={sort} recentHref="/recommendations" popularHref="/recommendations?sort=popular" />
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No approved posts yet.</p>
      ) : feedPosts.length > 0 ? (
        <ul className="space-y-4">
          {feedPosts.map((post) => {
            const my = reactionMap.get(post.id) ?? null;
            return (
              <li key={post.id}>
                <RecommendationPostCard
                  post={post}
                  myReaction={my}
                  isAdmin={isAdmin}
                  canPinOnRecommendationsFeed={isAdmin}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
