import bcrypt from "bcryptjs";
import { type Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeUsername } from "@/lib/username";
import { adminUserSearchSchema, profileUpdateSchema, registerSchema, userSearchSchema } from "@/lib/validators";

export async function createRegisteredUser(input: unknown) {
  const data = registerSchema.parse(input);
  const email = data.email.toLowerCase();
  const usernameNormalized = normalizeUsername(data.username);
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      username: data.username.trim(),
      usernameNormalized,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      role: UserRole.user,
    },
    select: { id: true },
  });
}

export async function updateOwnProfile(userId: string, input: unknown) {
  const data = profileUpdateSchema.parse(input);
  const usernameNormalized = normalizeUsername(data.username);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ usernameNormalized }, { username: data.username.trim() }],
      NOT: { id: userId },
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("USERNAME_TAKEN");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      username: data.username.trim(),
      usernameNormalized,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      isVerified: true,
      role: true,
    },
  });
}

export type PublicUserSearchRow = {
  username: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
};

export async function searchUsersPublic(queryRaw: unknown): Promise<PublicUserSearchRow[]> {
  const parsed = userSearchSchema.safeParse(
    typeof queryRaw === "string" ? { query: queryRaw } : queryRaw,
  );
  if (!parsed.success) {
    return [];
  }
  const q = parsed.data.query;
  const norm = normalizeUsername(q);
  if (norm.length < 1) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      usernameNormalized: { contains: norm },
    },
    take: 10,
    orderBy: { username: "asc" },
    select: {
      username: true,
      firstName: true,
      lastName: true,
      isVerified: true,
    },
  });
}

export async function getUserByUsernameNormalizedForPublic(usernameParam: string) {
  const usernameNormalized = normalizeUsername(usernameParam);
  const user = await prisma.user.findUnique({
    where: { usernameNormalized },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      isVerified: true,
    },
  });
  return user;
}

export async function listUsersForAdmin(searchQuery?: string) {
  const parsed = adminUserSearchSchema.safeParse({ query: searchQuery });
  const q = parsed.success && parsed.data.query ? parsed.data.query.trim() : "";

  const where: Prisma.UserWhereInput =
    q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });
}

export async function getUserDetailForAdmin(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });
}

type ReactionWithPost = Prisma.ReactionGetPayload<{
  include: {
    post: {
      include: {
        author: { select: { username: true, firstName: true, lastName: true } },
      },
    },
  },
}>;

export async function listReactionHistoryForAdmin(userId: string): Promise<ReactionWithPost[]> {
  return prisma.reaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          author: { select: { username: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

export async function setUserVerified(userId: string, isVerified: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { isVerified },
    select: { id: true, isVerified: true },
  });
}

export async function countReactionsByPostAndType(
  postIds: string[],
): Promise<{ postId: string; type: "like" | "dislike"; count: number }[]> {
  if (postIds.length === 0) {
    return [];
  }
  const rows = await prisma.reaction.groupBy({
    by: ["postId", "type"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  });
  return rows.map((r) => ({
    postId: r.postId,
    type: r.type === "like" ? "like" : "dislike",
    count: r._count._all,
  }));
}

export async function getLikeDislikeCountsForPosts(postIds: string[]) {
  const rows = await countReactionsByPostAndType(postIds);
  const map = new Map<string, { likes: number; dislikes: number }>();
  for (const id of postIds) {
    map.set(id, { likes: 0, dislikes: 0 });
  }
  for (const r of rows) {
    const cur = map.get(r.postId) ?? { likes: 0, dislikes: 0 };
    if (r.type === "like") {
      cur.likes = r.count;
    } else {
      cur.dislikes = r.count;
    }
    map.set(r.postId, cur);
  }
  return map;
}

export class UserDeleteError extends Error {
  constructor(readonly code: "NOT_FOUND" | "CANNOT_DELETE_SELF" | "LAST_ADMIN") {
    super(code);
    this.name = "UserDeleteError";
  }
}

export async function deleteUserById(actorId: string, targetUserId: string): Promise<void> {
  if (actorId === targetUserId) {
    throw new UserDeleteError("CANNOT_DELETE_SELF");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });
  if (!target) {
    throw new UserDeleteError("NOT_FOUND");
  }

  if (target.role === UserRole.admin) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.admin },
    });
    if (adminCount <= 1) {
      throw new UserDeleteError("LAST_ADMIN");
    }
  }

  await prisma.user.delete({ where: { id: targetUserId } });
}
