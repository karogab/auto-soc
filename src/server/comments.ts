import { PostStatus, Prisma, ReactionType, type ReportReason, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PermissionError } from "@/lib/permissions";
import {
  commentReactionSchema,
  createCommentReportSchema,
  createCommentSchema,
} from "@/lib/validators";

export type CommentAuthor = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
};

export type CommentForFeed = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  text: string;
  pinnedOnPost: boolean;
  createdAt: Date;
  author: CommentAuthor;
  parent: { id: string; author: { username: string } } | null;
  likeCount: number;
  dislikeCount: number;
};

const commentSelect = {
  id: true,
  postId: true,
  authorId: true,
  parentCommentId: true,
  text: true,
  pinnedOnPost: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      isVerified: true,
    },
  },
  parent: {
    select: {
      id: true,
      author: { select: { username: true } },
    },
  },
} as const;

export async function createComment(authorId: string, input: unknown) {
  const data = createCommentSchema.parse(input);

  const post = await prisma.post.findFirst({
    where: { id: data.postId, status: PostStatus.approved },
    select: { id: true },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }

  if (data.parentCommentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentCommentId },
      select: { id: true, postId: true },
    });
    if (!parent || parent.postId !== data.postId) {
      throw new Error("NOT_FOUND");
    }
  }

  return prisma.comment.create({
    data: {
      postId: data.postId,
      authorId,
      parentCommentId: data.parentCommentId ?? null,
      text: data.text,
    },
    select: { id: true },
  });
}

async function getLikeDislikeCountsForComments(commentIds: string[]) {
  const map = new Map<string, { likes: number; dislikes: number }>();
  for (const id of commentIds) {
    map.set(id, { likes: 0, dislikes: 0 });
  }
  if (commentIds.length === 0) {
    return map;
  }
  const rows = await prisma.commentReaction.groupBy({
    by: ["commentId", "type"],
    where: { commentId: { in: commentIds } },
    _count: { _all: true },
  });
  for (const r of rows) {
    const cur = map.get(r.commentId) ?? { likes: 0, dislikes: 0 };
    if (r.type === ReactionType.like) {
      cur.likes = r._count._all;
    } else {
      cur.dislikes = r._count._all;
    }
    map.set(r.commentId, cur);
  }
  return map;
}

export async function getCurrentUserReactionsForComments(userId: string, commentIds: string[]) {
  if (commentIds.length === 0) {
    return new Map<string, "like" | "dislike">();
  }
  const rows = await prisma.commentReaction.findMany({
    where: { userId, commentId: { in: commentIds } },
    select: { commentId: true, type: true },
  });
  const m = new Map<string, "like" | "dislike">();
  for (const r of rows) {
    m.set(r.commentId, r.type === ReactionType.like ? "like" : "dislike");
  }
  return m;
}

export async function listCommentsForPostIds(postIds: string[]): Promise<CommentForFeed[]> {
  if (postIds.length === 0) {
    return [];
  }
  const rows = await prisma.comment.findMany({
    where: { postId: { in: postIds } },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
  const counts = await getLikeDislikeCountsForComments(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    likeCount: counts.get(r.id)?.likes ?? 0,
    dislikeCount: counts.get(r.id)?.dislikes ?? 0,
  }));
}

export type AuthorCommentRow = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  text: string;
  createdAt: Date;
  post: {
    id: string;
    text: string;
    author: { username: string };
  };
  parent: { author: { username: string } } | null;
};

export async function listCommentsForAuthor(authorId: string): Promise<AuthorCommentRow[]> {
  return prisma.comment.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      postId: true,
      parentCommentId: true,
      text: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          text: true,
          author: { select: { username: true } },
        },
      },
      parent: {
        select: {
          author: { select: { username: true } },
        },
      },
    },
  });
}

export async function setCommentReaction(userId: string, input: unknown) {
  const { commentId, type } = commentReactionSchema.parse(input);

  const desired = type === "like" ? ReactionType.like : ReactionType.dislike;

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        post: { select: { status: true } },
      },
    });
    if (!comment || comment.post.status !== PostStatus.approved) {
      throw new Error("NOT_FOUND");
    }

    const existing = await tx.commentReaction.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (!existing) {
      await tx.commentReaction.create({
        data: { userId, commentId, type: desired },
      });
      return { state: desired as "like" | "dislike" };
    }

    if (existing.type === desired) {
      await tx.commentReaction.delete({ where: { id: existing.id } });
      return { state: null as "like" | "dislike" | null };
    }

    await tx.commentReaction.update({
      where: { id: existing.id },
      data: { type: desired },
    });
    return { state: desired as "like" | "dislike" };
  });
}

export async function createCommentReport(reporterId: string, input: unknown) {
  const data = createCommentReportSchema.parse(input);

  const comment = await prisma.comment.findUnique({
    where: { id: data.commentId },
    select: { id: true, post: { select: { status: true } } },
  });
  if (!comment || comment.post.status !== PostStatus.approved) {
    throw new Error("NOT_FOUND");
  }

  try {
    return await prisma.commentReport.create({
      data: {
        commentId: data.commentId,
        reporterId,
        reason: data.reason as ReportReason,
        comment: data.comment ?? null,
      },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("ALREADY_REPORTED");
    }
    throw e;
  }
}

type PinActor = {
  id: string;
  role: "user" | "admin";
};

export async function setCommentPinned(commentId: string, pinned: boolean, actor: PinActor) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      postId: true,
      post: { select: { authorId: true, status: true } },
    },
  });
  if (!comment) {
    throw new Error("NOT_FOUND");
  }

  const isAdmin = actor.role === UserRole.admin;
  const isPostAuthor = actor.id === comment.post.authorId;
  if (!isAdmin && !isPostAuthor) {
    throw new PermissionError("FORBIDDEN");
  }

  if (comment.post.status !== PostStatus.approved) {
    throw new Error("NOT_FOUND");
  }

  if (pinned) {
    await prisma.$transaction([
      prisma.comment.updateMany({
        where: { postId: comment.postId, pinnedOnPost: true },
        data: { pinnedOnPost: false },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { pinnedOnPost: true },
      }),
    ]);
    return;
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { pinnedOnPost: false },
  });
}

export function sortCommentsForDisplay<T extends { pinnedOnPost: boolean; createdAt: Date }>(
  comments: T[],
): T[] {
  return [...comments].sort((a, b) => {
    if (a.pinnedOnPost !== b.pinnedOnPost) {
      return a.pinnedOnPost ? -1 : 1;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

export function groupCommentsByPostId(
  comments: CommentForFeed[],
): Map<string, CommentForFeed[]> {
  const map = new Map<string, CommentForFeed[]>();
  for (const c of comments) {
    const arr = map.get(c.postId) ?? [];
    arr.push(c);
    map.set(c.postId, arr);
  }
  for (const [k, v] of map) {
    map.set(k, sortCommentsForDisplay(v));
  }
  return map;
}
