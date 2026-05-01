import { PostStatus, ReactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reactionSchema } from "@/lib/validators";
import { deleteReactionNotification, upsertReactionNotification } from "@/server/notification-sql";

export async function setReaction(userId: string, input: unknown) {
  const { postId, type } = reactionSchema.parse(input);

  const desired = type === "like" ? ReactionType.like : ReactionType.dislike;
  const desiredNotification: "like" | "dislike" = desired === ReactionType.like ? "like" : "dislike";

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({
      where: { id: postId, status: PostStatus.approved },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new Error("NOT_FOUND");
    }

    const existing = await tx.reaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    const shouldNotify = post.authorId !== userId;

    const removeNotificationIfNeeded = () => {
      if (!shouldNotify) {
        return Promise.resolve();
      }
      return deleteReactionNotification(tx, post.authorId, userId, postId);
    };

    const upsertNotification = () => {
      if (!shouldNotify) {
        return Promise.resolve();
      }
      return upsertReactionNotification(tx, {
        recipientId: post.authorId,
        actorId: userId,
        postId,
        type: desiredNotification,
      });
    };

    if (!existing) {
      await tx.reaction.create({
        data: { userId, postId, type: desired },
      });
      await upsertNotification();
      return { state: desired as "like" | "dislike" };
    }

    if (existing.type === desired) {
      await tx.reaction.delete({ where: { id: existing.id } });
      await removeNotificationIfNeeded();
      return { state: null as "like" | "dislike" | null };
    }

    await tx.reaction.update({
      where: { id: existing.id },
      data: { type: desired },
    });
    await upsertNotification();
    return { state: desired as "like" | "dislike" };
  });
}
