"use client";

import { useActionState } from "react";
import { createQuestionAction, createSuggestionAction } from "@/actions/support";

export function SupportSection() {
  const [qState, qAction, qPending] = useActionState(createQuestionAction, undefined);
  const [sState, sAction, sPending] = useActionState(createSuggestionAction, undefined);

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Ask admin a question</h2>
        <form action={qAction} className="mt-3 max-w-xl space-y-2">
          <input
            name="subject"
            placeholder="Subject (optional)"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          <textarea
            name="message"
            required
            rows={3}
            placeholder="Your message"
            className="w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          {qState?.error ? <p className="text-sm text-rose-600">{qState.error}</p> : null}
          {qState?.ok ? <p className="text-sm text-emerald-700 dark:text-emerald-400">Question sent.</p> : null}
          <button
            type="submit"
            disabled={qPending}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Submit question
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Suggest a feature</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">What would you like to see in this social network?</p>
        <form action={sAction} className="mt-3 max-w-xl space-y-2">
          <textarea
            name="message"
            required
            rows={3}
            placeholder="Your idea…"
            className="w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
          {sState?.error ? <p className="text-sm text-rose-600">{sState.error}</p> : null}
          {sState?.ok ? <p className="text-sm text-emerald-700 dark:text-emerald-400">Thanks for your suggestion.</p> : null}
          <button
            type="submit"
            disabled={sPending}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Submit suggestion
          </button>
        </form>
      </div>
    </div>
  );
}
