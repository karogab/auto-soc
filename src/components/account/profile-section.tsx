"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/user";

export type AccountProfile = {
  username: string;
  firstName: string;
  lastName: string;
};

export function ProfileSection({ profile }: { profile: AccountProfile }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Edit profile</h2>
      <form action={action} className="mt-3 max-w-md space-y-3">
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            required
            defaultValue={profile.username}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            defaultValue={profile.firstName}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            required
            defaultValue={profile.lastName}
            className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </div>
        {state?.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-emerald-600">Profile updated.</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save profile
        </button>
      </form>
    </div>
  );
}
