import { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createPostSchema } from "@/lib/validators";
import { getLikeDislikeCountsForPosts } from "@/server/users";

/** Thrown when DB is missing `Post.pinnedOnRecommendations` (migration not applied). */
export class PinnedColumnMissingError extends Error {
  constructor() {
    super(
      'Missing column "pinnedOnRecommendations" on "Post". Run: npx prisma migrate dev (or npx prisma db push).',
    );
    this.name = "PinnedColumnMissingError";
  }
}

function isMissingPinnedColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as { code?: string; message?: string };
  return (
    e.code === "P2010" &&
    typeof e.message === "string" &&
    (e.message.includes("pinnedOnRecommendations") || e.message.includes("42703"))
  );
}

export async function createPendingPost(authorId: string, input: unknown) {
  const { text } = createPostSchema.parse(input);
  return prisma.post.create({
    data: {
      authorId,
      text,
      status: PostStatus.pending,
    },
    select: { id: true },
  });
}

export async function listMyPosts(authorId: string) {
  return prisma.post.findMany({
    where: { authorId, NOT: { status: PostStatus.deleted } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      status: true,
      createdAt: true,
    },
  });
}

export type FeedSortMode = "recent" | "popular";

function feedTimeMs(approvedAt: Date | null, createdAt: Date): number {
  return (approvedAt ?? createdAt).getTime();
}

export async function listApprovedFeedPosts(options?: { sort?: FeedSortMode }) {
  const sortMode: FeedSortMode = options?.sort === "popular" ? "popular" : "recent";
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.approved },
    include: {
      author: {
        select: { firstName: true, lastName: true, username: true, isVerified: true },
      },
    },
  });

  let pinnedRows: Array<{ id: string }> = [];
  try {
    pinnedRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Post"
      WHERE "status" = 'approved' AND "pinnedOnRecommendations" = true
    `;
  } catch (error) {
    if (!isMissingPinnedColumnError(error)) {
      throw error;
    }
  }
  const pinnedIds = new Set(pinnedRows.map((r) => r.id));
  const ids = posts.map((p) => p.id);
  const counts = await getLikeDislikeCountsForPosts(ids);
  const enriched = posts.map((p) => ({
    ...p,
    pinnedOnRecommendations: pinnedIds.has(p.id),
    likeCount: counts.get(p.id)?.likes ?? 0,
    dislikeCount: counts.get(p.id)?.dislikes ?? 0,
  }));

  enriched.sort((a, b) => {
    if (a.pinnedOnRecommendations !== b.pinnedOnRecommendations) {
      return a.pinnedOnRecommendations ? -1 : 1;
    }
    if (sortMode === "popular") {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return feedTimeMs(b.approvedAt, b.createdAt) - feedTimeMs(a.approvedAt, a.createdAt);
    }
    return feedTimeMs(b.approvedAt, b.createdAt) - feedTimeMs(a.approvedAt, a.createdAt);
  });

  return enriched;
}

export async function listApprovedPostsForAuthor(authorId: string, options?: { sort?: FeedSortMode }) {
  const sortMode: FeedSortMode = options?.sort === "popular" ? "popular" : "recent";
  const posts = await prisma.post.findMany({
    where: { authorId, status: PostStatus.approved },
    include: {
      author: {
        select: { firstName: true, lastName: true, username: true, isVerified: true },
      },
    },
  });
  const ids = posts.map((p) => p.id);
  const counts = await getLikeDislikeCountsForPosts(ids);
  const enriched = posts.map((p) => ({
    ...p,
    pinnedOnRecommendations: false,
    likeCount: counts.get(p.id)?.likes ?? 0,
    dislikeCount: counts.get(p.id)?.dislikes ?? 0,
  }));

  enriched.sort((a, b) => {
    if (sortMode === "popular") {
      if (b.likeCount !== a.likeCount) {
        return b.likeCount - a.likeCount;
      }
      return feedTimeMs(b.approvedAt, b.createdAt) - feedTimeMs(a.approvedAt, a.createdAt);
    }
    return feedTimeMs(b.approvedAt, b.createdAt) - feedTimeMs(a.approvedAt, a.createdAt);
  });

  return enriched;
}

export async function countApprovedPostsForAuthor(authorId: string): Promise<number> {
  return prisma.post.count({
    where: { authorId, status: PostStatus.approved },
  });
}

export async function setApprovedPostPinnedOnRecommendations(postId: string, pinned: boolean) {
  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.approved },
    select: { id: true },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }
  // Raw SQL so pin works even if `prisma generate` was not re-run after adding
  // `pinnedOnRecommendations` (stale client rejects it on updateMany/update).
  try {
    if (pinned) {
      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE "Post" SET "pinnedOnRecommendations" = false WHERE "status" = 'approved'
        `,
        prisma.$executeRaw`
          UPDATE "Post" SET "pinnedOnRecommendations" = true WHERE "id" = ${postId}
        `,
      ]);
      return;
    }
    await prisma.$executeRaw`
      UPDATE "Post" SET "pinnedOnRecommendations" = false WHERE "id" = ${postId}
    `;
  } catch (error) {
    if (isMissingPinnedColumnError(error)) {
      throw new PinnedColumnMissingError();
    }
    throw error;
  }
}

export async function getCurrentUserReactionsForPosts(userId: string, postIds: string[]) {
  if (postIds.length === 0) {
    return new Map<string, "like" | "dislike">();
  }
  const rows = await prisma.reaction.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true, type: true },
  });
  const m = new Map<string, "like" | "dislike">();
  for (const r of rows) {
    m.set(r.postId, r.type === "like" ? "like" : "dislike");
  }
  return m;
}

export async function listPendingPostsForModeration() {
  return prisma.post.findMany({
    where: { status: PostStatus.pending },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: {
          username: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

export async function approvePost(postId: string, adminId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.pending },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }
  return prisma.post.update({
    where: { id: postId },
    data: {
      status: PostStatus.approved,
      approvedAt: new Date(),
      approvedByAdminId: adminId,
      rejectedAt: null,
      rejectedByAdminId: null,
    },
  });
}

export async function rejectPost(postId: string, _adminId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.pending },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }
  await prisma.post.delete({ where: { id: postId } });
}

export async function deletePostIfOwned(postId: string, userId: string) {
  const deleted = await prisma.post.deleteMany({
    where: { id: postId, authorId: userId },
  });
  if (deleted.count === 0) {
    throw new Error("NOT_FOUND");
  }
}

export async function adminDeletePostById(postId: string) {
  const deleted = await prisma.post.deleteMany({
    where: { id: postId },
  });
  if (deleted.count === 0) {
    throw new Error("NOT_FOUND");
  }
}

export async function listPostsForAdminSearch(textQuery: string | undefined, take = 80) {
  const q = textQuery?.trim() ?? "";
  const notDeleted = { NOT: { status: PostStatus.deleted } } as const;
  const where =
    q.length >= 1
      ? { AND: [{ text: { contains: q, mode: "insensitive" as const } }, notDeleted] }
      : notDeleted;
  return prisma.post.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, username: true, email: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function listPostsForAdminByAuthor(authorId: string) {
  const posts = await prisma.post.findMany({
    where: { authorId, NOT: { status: PostStatus.deleted } },
    orderBy: { createdAt: "desc" },
  });
  const ids = posts.map((p) => p.id);
  const ld = await getLikeDislikeCountsForPosts(ids);
  const reportGroups =
    ids.length === 0
      ? []
      : await prisma.report.groupBy({
          by: ["postId"],
          where: { postId: { in: ids } },
          _count: { _all: true },
        });
  const reportMap = new Map(reportGroups.map((r) => [r.postId, r._count._all]));
  return posts.map((p) => ({
    ...p,
    likeCount: ld.get(p.id)?.likes ?? 0,
    dislikeCount: ld.get(p.id)?.dislikes ?? 0,
    reportCount: reportMap.get(p.id) ?? 0,
  }));
}

/** Removes an approved post from the feed and deletes the row (reactions, reports, notifications cascade). */
export async function setPostStatusRejectedOrDeleted(
  postId: string,
  _status: "rejected" | "deleted",
  _adminId: string,
) {
  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.approved },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }
  await prisma.post.delete({ where: { id: postId } });
}
