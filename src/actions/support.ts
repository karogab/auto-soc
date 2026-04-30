"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { PermissionError, requireSession } from "@/lib/permissions";
import { createQuestion } from "@/server/questions";
import { createReport } from "@/server/reports";
import { createSuggestion } from "@/server/suggestions";
import { searchUsersPublic } from "@/server/users";
import type { ActionResult } from "@/actions/auth";

export async function createReportAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = {
      postId: formData.get("postId"),
      reason: formData.get("reason"),
      comment: formData.get("comment"),
    };
    await createReport(session.user.id, raw);
    const postId = String(raw.postId ?? "");
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { author: { select: { username: true } } },
      });
      if (post?.author.username) {
        revalidatePath(`/users/${encodeURIComponent(post.author.username)}`);
      }
    }
    revalidatePath("/recommendations");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return { error: "Cannot report this post." };
    }
    if (e instanceof Error && e.message === "ALREADY_REPORTED") {
      return { error: "You already reported this post." };
    }
    return { error: "Invalid report." };
  }
}

export async function createQuestionAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = {
      subject: formData.get("subject"),
      message: formData.get("message"),
    };
    await createQuestion(session.user.id, raw);
    revalidatePath("/account", "layout");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    return { error: "Invalid question." };
  }
}

export async function createSuggestionAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = { message: formData.get("message") };
    await createSuggestion(session.user.id, raw);
    revalidatePath("/account", "layout");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    return { error: "Invalid suggestion." };
  }
}

export async function searchUsersForNavAction(query: string) {
  await requireSession();
  return searchUsersPublic({ query });
}
