import { requireSession } from "@/lib/permissions";
import { listApprovedFeedPosts, getCurrentUserReactionsForPosts, type FeedSortMode } from "@/server/posts";
import {
  getCurrentUserReactionsForComments,
  groupCommentsByPostId,
  listCommentsForPostIds,
  type CommentForFeed,
} from "@/server/comments";
import { FeedSortTabs } from "@/components/feed-sort-tabs";
import { RecommendationPostCard } from "@/components/recommendation-post-card";
import { CommentList } from "@/components/comment-list";

type PageProps = {
  searchParams: Promise<{ sort?: string; post?: string }>;
};

function parseFeedSort(raw: string | undefined): FeedSortMode {
  return raw === "popular" ? "popular" : "recent";
}

type FeedPost = Awaited<ReturnType<typeof listApprovedFeedPosts>>[number];

function buildSortHref(base: string, post: string | undefined): string {
  return post ? `${base}${base.includes("?") ? "&" : "?"}post=${encodeURIComponent(post)}` : base;
}

export default async function RecommendationsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const sp = await searchParams;
  const sort = parseFeedSort(sp.sort);
  const selectedPostId = typeof sp.post === "string" && sp.post.length > 0 ? sp.post : null;

  const posts = await listApprovedFeedPosts({ sort });
  const ids = posts.map((p) => p.id);
  const reactionMap = await getCurrentUserReactionsForPosts(session.user.id, ids);
  const isAdmin = session.user.role === "admin";

  const allComments = await listCommentsForPostIds(ids);
  const commentsByPost = groupCommentsByPostId(allComments);
  const commentReactionMap = await getCurrentUserReactionsForComments(
    session.user.id,
    allComments.map((c) => c.id),
  );

  const pinnedPost = posts.find((p) => p.pinnedOnRecommendations) ?? null;
  const selectedPost =
    selectedPostId && (!pinnedPost || pinnedPost.id !== selectedPostId)
      ? posts.find((p) => p.id === selectedPostId) ?? null
      : null;

  const excludedIds = new Set<string>();
  if (pinnedPost) excludedIds.add(pinnedPost.id);
  if (selectedPost) excludedIds.add(selectedPost.id);
  const feedPosts = posts.filter((p) => !excludedIds.has(p.id));

  const recentHref = buildSortHref("/recommendations", selectedPostId ?? undefined);
  const popularHref = buildSortHref("/recommendations?sort=popular", selectedPostId ?? undefined);

  const renderPostBlock = (post: FeedPost, opts?: { showPinnedLabel?: boolean }) => (
    <RecommendationPostCard
      post={post}
      myReaction={reactionMap.get(post.id) ?? null}
      isAdmin={isAdmin}
      showPinnedLabel={opts?.showPinnedLabel ?? false}
      canPinOnRecommendationsFeed={isAdmin}
    >
      <CommentList
        postId={post.id}
        postAuthorUsername={post.author.username}
        comments={(commentsByPost.get(post.id) ?? []) as CommentForFeed[]}
        myReactions={commentReactionMap}
        canPin={isAdmin || session.user.id === post.authorId}
      />
    </RecommendationPostCard>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Recommendations</h1>
      {pinnedPost ? renderPostBlock(pinnedPost, { showPinnedLabel: true }) : null}
      {selectedPost ? renderPostBlock(selectedPost) : null}
      <FeedSortTabs active={sort} recentHref={recentHref} popularHref={popularHref} />
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No approved posts yet.</p>
      ) : feedPosts.length > 0 ? (
        <ul className="space-y-4">
          {feedPosts.map((post) => (
            <li key={post.id}>{renderPostBlock(post)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
