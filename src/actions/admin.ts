"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PermissionError, requireAdminSession } from "@/lib/permissions";
import { updateQuestionStatus } from "@/server/questions";
import { updateReportStatus } from "@/server/reports";
import { deleteUserById, setUserVerified, UserDeleteError } from "@/server/users";
import { updateSuggestionStatus } from "@/server/suggestions";
import type { ActionResult } from "@/actions/auth";
import {
  adminUserIdSchema,
  questionStatusUpdateSchema,
  reportStatusUpdateSchema,
  suggestionStatusUpdateSchema,
} from "@/lib/validators";

export async function setUserVerifiedAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminSession();
    const userId = String(formData.get("userId") ?? "");
    const value = String(formData.get("verified") ?? "") === "true";
    if (!userId) {
      return { error: "Missing user." };
    }
    await setUserVerified(userId, value);
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/recommendations");
    revalidatePath("/account", "layout");
    if (u?.username) {
      revalidatePath(`/users/${encodeURIComponent(u.username)}`);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Forbidden." };
    }
    throw e;
  }
}

export async function updateReportStatusAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const raw = {
    reportId: formData.get("reportId"),
    status: formData.get("status"),
  };
  const parsed = reportStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }
  await updateReportStatus(parsed.data);
  revalidatePath("/admin/reports");
}

export async function updateQuestionStatusAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const raw = {
    questionId: formData.get("questionId"),
    status: formData.get("status"),
  };
  const parsed = questionStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }
  await updateQuestionStatus(parsed.data);
  revalidatePath("/admin/questions");
}

export async function updateSuggestionStatusAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const raw = {
    suggestionId: formData.get("suggestionId"),
    status: formData.get("status"),
  };
  const parsed = suggestionStatusUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return;
  }
  await updateSuggestionStatus(parsed.data);
  revalidatePath("/admin/suggestions");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  const parsed = adminUserIdSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return;
  }
  const { userId } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  if (!target) {
    return;
  }

  try {
    await deleteUserById(session.user.id, userId);
  } catch (e) {
    if (e instanceof UserDeleteError) {
      if (e.code === "CANNOT_DELETE_SELF") {
        redirect(`/admin/users/${userId}?userError=cannot_delete_self`);
      }
      if (e.code === "LAST_ADMIN") {
        redirect(`/admin/users/${userId}?userError=last_admin`);
      }
      return;
    }
    throw e;
  }

  revalidatePath("/admin/users");
  revalidatePath("/recommendations");
  revalidatePath("/account", "layout");
  if (target.username) {
    revalidatePath(`/users/${encodeURIComponent(target.username)}`);
  }
  redirect("/admin/users");
}
