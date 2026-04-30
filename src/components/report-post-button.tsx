"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/actions/auth";
import { createReportAction } from "@/actions/support";

const reasons = [
  { value: "spam", label: "Spam" },
  { value: "offensive", label: "Offensive" },
  { value: "false_information", label: "False information" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "other", label: "Other" },
] as const;

type ReportPostButtonProps = {
  postId: string;
  /** Replaces default `mt-2` on the root wrapper (e.g. `mt-0` in tight layouts). */
  rootClassName?: string;
};

export function ReportPostButton({ postId, rootClassName = "mt-2" }: ReportPostButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | undefined, FormData>(
    createReportAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  if (state?.ok) {
    return (
      <div className={rootClassName}>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Report submitted.</p>
      </div>
    );
  }

  return (
    <div className={rootClassName}>
      {!open ? (
        <button
          type="button"
          className="text-sm text-zinc-600 underline decoration-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          onClick={() => setOpen(true)}
        >
          Report
        </button>
      ) : (
        <form
          action={action}
          className="mt-2 w-72 max-w-[min(100vw-2rem,18rem)] space-y-2 rounded-md border border-zinc-200 p-3 text-left dark:border-zinc-700 sm:ml-0 sm:mr-0"
        >
          <input type="hidden" name="postId" value={postId} />
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Reason</label>
            <select
              name="reason"
              required
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              defaultValue="spam"
            >
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Comment (optional)</label>
            <textarea
              name="comment"
              rows={2}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
            />
          </div>
          {state?.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-zinc-900 px-3 py-1 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Submit report
            </button>
            <button type="button" className="text-sm text-zinc-600 dark:text-zinc-400" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
