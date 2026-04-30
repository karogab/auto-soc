"use server";

import { revalidatePath } from "next/cache";
import { unstable_update } from "@/auth";
import { PermissionError, requireSession } from "@/lib/permissions";
import { updateOwnProfile } from "@/server/users";
import type { ActionResult } from "@/actions/auth";

export async function updateProfileAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const raw = Object.fromEntries(formData.entries());
    const updated = await updateOwnProfile(session.user.id, raw);
    await unstable_update({
      user: {
        username: updated.username,
        name: `${updated.firstName} ${updated.lastName}`,
        role: updated.role === "admin" ? "admin" : "user",
      },
    });
    revalidatePath("/account", "layout");
    revalidatePath("/recommendations");
    return { ok: true };
  } catch (e) {
    if (e instanceof PermissionError) {
      return { error: "Not signed in." };
    }
    if (e instanceof Error && e.message === "USERNAME_TAKEN") {
      return { error: "Username is already taken." };
    }
    throw e;
  }
}
