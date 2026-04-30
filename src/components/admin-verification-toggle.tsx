"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/actions/auth";
import { setUserVerifiedAction } from "@/actions/admin";

type VerificationToggleProps = {
  userId: string;
  isVerified: boolean;
};

export function VerificationToggle({ userId, isVerified }: VerificationToggleProps) {
  const [state, action, pending] = useActionState(setUserVerifiedAction, undefined as ActionResult | undefined);

  return (
    <div className="space-y-2">
      {state?.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-600">Verification updated.</p> : null}
      {isVerified ? (
        <form action={action}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="verified" value="false" />
          <button
            type="submit"
            disabled={pending}
            className="rounded border border-rose-300 px-3 py-1.5 text-sm text-rose-800 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950"
          >
            Remove verification
          </button>
        </form>
      ) : (
        <form action={action}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="verified" value="true" />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Give verification
          </button>
        </form>
      )}
    </div>
  );
}
