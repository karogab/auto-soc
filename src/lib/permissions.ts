import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export class PermissionError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN";

  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = "PermissionError";
  }
}

export async function getOptionalSession() {
  return auth();
}

async function redirectToLogin(): Promise<never> {
  let callbackPath = "";
  try {
    const h = await headers();
    const referer = h.get("referer");
    if (referer) {
      const u = new URL(referer);
      const path = `${u.pathname}${u.search}`;
      if (path.startsWith("/") && !path.startsWith("//") && path !== "/login" && path !== "/register") {
        callbackPath = path;
      }
    }
  } catch {
    /* ignore invalid referer */
  }
  if (callbackPath) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  redirect("/login");
}

export async function requireSession() {
  const session = await auth();
  if (session?.user?.id) {
    return session;
  }
  await redirectToLogin();
  throw new Error("unreachable");
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new PermissionError("FORBIDDEN");
  }
  return session;
}
