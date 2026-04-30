"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PermissionError, requireAdminSession, requireSession } from "@/lib/permissions";
import {
  adminDeletePostById,
  approvePost,
  createPendingPost,
  deletePostIfOwned,
  rejectPost,
  setApprovedPostPinnedOnRecommendations,
  setPostStatusRejectedOrDeleted,
} from "@/server/posts";
import { setReaction } from "@/server/reactions";
import type { ActionResult } from "@/actions/auth";
import { moderationPostIdSchema } from "@/lib/validators";

export async function createPostAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const text = String(formData.get("text") ?? "");
    await createPendingPost(session.user.id, { text });
    revalidatePath("/account", "layout");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    if (e && typeof e === "object" && "issues" in e) {
      return { error: "Invalid post text." };
    }
    throw e;
  }
}

export async function reactToPostAction(postId: string, type: "like" | "dislike"): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await setReaction(session.user.id, { postId, type });
    const author = await prisma.post.findUnique({
      where: { id: postId },
      select: { author: { select: { username: true } } },
    });
    revalidatePath("/recommendations");
    if (author?.author.username) {
      revalidatePath(`/users/${encodeURIComponent(author.author.username)}`);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    return { error: "Could not update reaction." };
  }
}

export async function approvePostAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  await approvePost(parsed.data.postId, session.user.id);
  const author = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { author: { select: { username: true } } },
  });
  revalidatePath("/admin/moderation");
  revalidatePath("/recommendations");
  revalidatePath("/account", "layout");
  if (author?.author.username) {
    revalidatePath(`/users/${encodeURIComponent(author.author.username)}`);
  }
}

export async function rejectPostAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  const before = await prisma.post.findUnique({
    where: { id: parsed.data.postId },
    select: { author: { select: { username: true, id: true } } },
  });
  await rejectPost(parsed.data.postId, session.user.id);
  revalidatePath("/admin/moderation");
  revalidatePath("/recommendations");
  revalidatePath("/account", "layout");
  if (before?.author.id) {
    revalidatePath(`/admin/users/${before.author.id}`);
  }
  if (before?.author.username) {
    revalidatePath(`/users/${encodeURIComponent(before.author.username)}`);
  }
}

export async function setRecommendationsPinAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  const pinRaw = String(formData.get("pinned") ?? "");
  const pinned = pinRaw === "1";
  try {
    await setApprovedPostPinnedOnRecommendations(parsed.data.postId, pinned);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return;
    }
    throw e;
  }
  revalidatePath("/recommendations");
}

export async function deleteMyPostAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  const postId = parsed.data.postId;
  const meta = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, author: { select: { username: true, id: true } } },
  });
  if (!meta || meta.authorId !== session.user.id) {
    return;
  }
  try {
    await deletePostIfOwned(postId, session.user.id);
  } catch {
    return;
  }
  revalidatePath("/account", "layout");
  revalidatePath("/recommendations");
  revalidatePath("/admin/moderation");
  revalidatePath(`/admin/users/${meta.author.id}`);
  revalidatePath(`/users/${encodeURIComponent(meta.author.username)}`);
}

export async function adminDeletePostAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  const postId = parsed.data.postId;
  const meta = await prisma.post.findUnique({
    where: { id: postId },
    select: { author: { select: { username: true, id: true } } },
  });
  if (!meta) {
    return;
  }
  try {
    await adminDeletePostById(postId);
  } catch {
    return;
  }
  revalidatePath("/admin/posts");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/reports");
  revalidatePath("/recommendations");
  revalidatePath("/account", "layout");
  revalidatePath(`/admin/users/${meta.author.id}`);
  revalidatePath(`/users/${encodeURIComponent(meta.author.username)}`);
}

export async function adminRemovePostFromFeedAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const parsed = moderationPostIdSchema.safeParse({ postId: formData.get("postId") });
  if (!parsed.success) {
    return;
  }
  const mode = String(formData.get("mode") ?? "rejected");
  const postId = parsed.data.postId;
  const before = await prisma.post.findUnique({
    where: { id: postId },
    select: { author: { select: { username: true, id: true } } },
  });
  await setPostStatusRejectedOrDeleted(postId, mode === "deleted" ? "deleted" : "rejected", session.user.id);
  revalidatePath("/admin/reports");
  revalidatePath("/recommendations");
  revalidatePath("/account", "layout");
  if (before?.author.id) {
    revalidatePath(`/admin/users/${before.author.id}`);
  }
  if (before?.author.username) {
    revalidatePath(`/users/${encodeURIComponent(before.author.username)}`);
  }
}
