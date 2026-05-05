import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import {
  countApprovedPostsForAuthor,
  getCurrentUserReactionsForPosts,
  listApprovedPostsForAuthor,
  type FeedSortMode,
} from "@/server/posts";
import {
  countApprovedCommentsForAuthor,
  getCurrentUserReactionsForComments,
  groupCommentsByPostId,
  listCommentsForAuthor,
  listCommentsForPostIds,
  type CommentForFeed,
} from "@/server/comments";
import { getUserByUsernameNormalizedForPublic } from "@/server/users";
import { CommentList } from "@/components/comment-list";
import { FeedSortTabs } from "@/components/feed-sort-tabs";
import { ProfileStatsAvatar } from "@/components/profile-stats-avatar";
import { RecommendationPostCard } from "@/components/recommendation-post-card";
import { VerifiedBadge } from "@/components/verified-badge";
import { formatDateTimeUtcPlus4 } from "@/lib/datetime";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ sort?: string }>;
};

function parseFeedSort(raw: string | undefined): FeedSortMode {
  return raw === "popular" ? "popular" : "recent";
}

const COMMENT_PREVIEW_LEN = 160;

function preview(text: string): string {
  const t = text.trim();
  return t.length <= COMMENT_PREVIEW_LEN ? t : `${t.slice(0, COMMENT_PREVIEW_LEN)}…`;
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

  const [posts, approvedPostCount, approvedCommentCount] = await Promise.all([
    listApprovedPostsForAuthor(user.id, { sort }),
    countApprovedPostsForAuthor(user.id),
    countApprovedCommentsForAuthor(user.id),
  ]);
  const postIds = posts.map((p) => p.id);
  const reactionMap = await getCurrentUserReactionsForPosts(session.user.id, postIds);
  const isAdmin = session.user.role === "admin";

  const allComments = await listCommentsForPostIds(postIds);
  const commentsByPost = groupCommentsByPostId(allComments);
  const commentReactionMap = await getCurrentUserReactionsForComments(
    session.user.id,
    allComments.map((c) => c.id),
  );

  const userComments = await listCommentsForAuthor(user.id);

  const userPath = `/users/${encodeURIComponent(user.username)}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="order-1 shrink-0 sm:order-2">
          <ProfileStatsAvatar
            approvedPostCount={approvedPostCount}
            approvedCommentCount={approvedCommentCount}
          />
        </div>
        <div className="order-2 min-w-0 w-full text-center sm:order-1 sm:w-auto sm:flex-1 sm:text-left">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            @{user.username}
            {user.isVerified ? <VerifiedBadge className="ml-1.5" aria-label="Verified" /> : null}
          </p>
        </div>
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
                >
                  <CommentList
                    postId={post.id}
                    postAuthorUsername={post.author.username}
                    comments={(commentsByPost.get(post.id) ?? []) as CommentForFeed[]}
                    myReactions={commentReactionMap}
                    canPin={isAdmin || session.user.id === post.authorId}
                  />
                </RecommendationPostCard>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Comments</h2>
        {userComments.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {userComments.map((c) => {
              const target = c.parent?.author.username ?? c.post.author.username;
              return (
                <li key={c.id}>
                  <Link
                    href={`/recommendations?post=${encodeURIComponent(c.postId)}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-baseline gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">@{user.username}</span>
                      <span aria-hidden>→</span>
                      <span>@{target}</span>
                      <span className="text-xs text-zinc-500">{formatDateTimeUtcPlus4(c.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-100">
                      {preview(c.text)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
