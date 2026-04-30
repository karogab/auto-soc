"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn } from "@/auth";
import { createRegisteredUser } from "@/server/users";
import { loginSchema, registerSchema } from "@/lib/validators";

export type ActionResult = { error?: string; ok?: boolean };

export async function registerAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  try {
    await createRegisteredUser(raw);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Email or username already taken." };
    }
    throw e;
  }

  try {
    await signIn("credentials", {
      email,
      password: data.password,
      redirectTo: "/recommendations",
    });
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    if (e instanceof AuthError) {
      return { error: "Account created but sign-in failed. Try logging in." };
    }
    throw e;
  }
  return { ok: true };
}

export async function loginAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }
  const callbackUrl =
    typeof raw.callbackUrl === "string" && raw.callbackUrl.startsWith("/") ? raw.callbackUrl : "/recommendations";

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    return { error: "Invalid email or password." };
  }
  return { ok: true };
}
