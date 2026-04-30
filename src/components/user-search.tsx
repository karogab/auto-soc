"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { searchUsersForNavAction } from "@/actions/support";
import { VerifiedBadge } from "@/components/verified-badge";

export function UserSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<
    { username: string; firstName: string; lastName: string; isVerified: boolean }[]
  >([]);
  const [open, setOpen] = useState(false);

  const run = useCallback(async (query: string) => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    try {
      const rows = await searchUsersForNavAction(query);
      setResults(rows);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void run(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q, run]);

  return (
    <div className="relative w-full max-w-xs">
      <label htmlFor="user-search" className="sr-only">
        Search users by username
      </label>
      <input
        id="user-search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search username…"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        autoComplete="off"
      />
      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-md dark:border-zinc-700 dark:bg-zinc-950">
          {results.map((u) => (
            <li key={u.username}>
              <Link
                href={`/users/${encodeURIComponent(u.username)}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.username}</span>
                {u.isVerified ? <VerifiedBadge size="sm" aria-label="Verified" /> : null}
                <span className="truncate text-zinc-500 dark:text-zinc-400">
                  {u.firstName} {u.lastName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
