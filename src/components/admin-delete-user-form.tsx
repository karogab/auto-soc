"use client";

import { deleteUserAction } from "@/actions/admin";

type AdminDeleteUserFormProps = {
  userId: string;
};

export function AdminDeleteUserForm({ userId }: AdminDeleteUserFormProps) {
  return (
    <form
      action={deleteUserAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Permanently delete this user? Their posts, reactions, reports, questions, and suggestions will be removed.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="mt-4 rounded border border-rose-200 p-4 dark:border-rose-900/50"
    >
      <input type="hidden" name="userId" value={userId} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Delete this user from the database. This cannot be undone.
      </p>
      <button
        type="submit"
        className="mt-3 rounded border border-rose-600 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100 dark:border-rose-500 dark:bg-rose-950 dark:text-rose-100 dark:hover:bg-rose-900"
      >
        Delete user
      </button>
    </form>
  );
}
