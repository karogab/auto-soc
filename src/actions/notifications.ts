"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/server/notifications";
import { notificationIdSchema } from "@/lib/validators";
import type { ActionResult } from "@/actions/auth";

function revalidateNotificationSurfaces() {
  revalidatePath("/notifications");
  revalidatePath("/recommendations", "layout");
}

export async function markNotificationAsReadAction(notificationId: string): Promise<ActionResult> {
  try {
    const parsed = notificationIdSchema.safeParse(notificationId);
    if (!parsed.success) {
      return { error: "Invalid notification." };
    }
    await markNotificationAsRead(parsed.data);
    revalidateNotificationSurfaces();
    return { ok: true };
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    return { error: "Could not update notification." };
  }
}

export async function markAllNotificationsAsReadAction(): Promise<ActionResult> {
  try {
    await markAllNotificationsAsRead();
    revalidateNotificationSurfaces();
    return { ok: true };
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    return { error: "Could not update notifications." };
  }
}
