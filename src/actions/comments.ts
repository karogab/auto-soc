"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PermissionError, requireSession } from "@/lib/permissions";
import {
  createComment,
  createCommentReport,
  setCommentPinned,
  setCommentReaction,
} from "@/server/comments";
import { commentIdSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

async function revalidateForPost(postId: string): Promise<void> {
  revalidatePath("/recommendations");
  const meta = await prisma.post.findUnique({
    where: { id: postId },
    select: { author: { select: { username: true } } },
  });
  if (meta?.author.username) {
    revalidatePath(`/users/${encodeURIComponent(meta.author.username)}`);
  }
}

export async function createCommentAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = {
      postId: formData.get("postId"),
      parentCommentId: formData.get("parentCommentId"),
      text: formData.get("text"),
    };
    await createComment(session.user.id, raw);
    const postId = String(raw.postId ?? "");
    if (postId) {
      await revalidateForPost(postId);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return { error: "Cannot comment on this post." };
    }
    if (e && typeof e === "object" && "issues" in e) {
      return { error: "Invalid comment." };
    }
    throw e;
  }
}

export async function reactToCommentAction(
  commentId: string,
  type: "like" | "dislike",
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await setCommentReaction(session.user.id, { commentId, type });
    const meta = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { postId: true },
    });
    if (meta?.postId) {
      await revalidateForPost(meta.postId);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    return { error: "Could not update reaction." };
  }
}

export async function createCommentReportAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = {
      commentId: formData.get("commentId"),
      reason: formData.get("reason"),
      comment: formData.get("comment"),
    };
    await createCommentReport(session.user.id, raw);
    const commentId = String(raw.commentId ?? "");
    if (commentId) {
      const meta = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { postId: true },
      });
      if (meta?.postId) {
        await revalidateForPost(meta.postId);
      }
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return { error: "Cannot report this comment." };
    }
    if (e instanceof Error && e.message === "ALREADY_REPORTED") {
      return { error: "You already reported this comment." };
    }
    return { error: "Invalid report." };
  }
}

export async function setCommentPinnedAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = commentIdSchema.safeParse({ commentId: formData.get("commentId") });
  if (!parsed.success) {
    return;
  }
  const pinned = String(formData.get("pinned") ?? "") === "1";
  try {
    await setCommentPinned(parsed.data.commentId, pinned, {
      id: session.user.id,
      role: session.user.role,
    });
  } catch (e) {
    if (e instanceof PermissionError) {
      return;
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return;
    }
    throw e;
  }
  const meta = await prisma.comment.findUnique({
    where: { id: parsed.data.commentId },
    select: { postId: true },
  });
  if (meta?.postId) {
    await revalidateForPost(meta.postId);
  }
}
