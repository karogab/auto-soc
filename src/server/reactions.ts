import { PostStatus, ReactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reactionSchema } from "@/lib/validators";

export async function setReaction(userId: string, input: unknown) {
  const { postId, type } = reactionSchema.parse(input);

  const post = await prisma.post.findFirst({
    where: { id: postId, status: PostStatus.approved },
    select: { id: true },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }

  const desired = type === "like" ? ReactionType.like : ReactionType.dislike;

  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (!existing) {
    await prisma.reaction.create({
      data: { userId, postId, type: desired },
    });
    return { state: desired as "like" | "dislike" };
  }

  if (existing.type === desired) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { state: null as "like" | "dislike" | null };
  }

  await prisma.reaction.update({
    where: { id: existing.id },
    data: { type: desired },
  });
  return { state: desired as "like" | "dislike" };
}
