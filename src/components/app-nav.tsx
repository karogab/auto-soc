import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/actions/session";
import { UserSearch } from "@/components/user-search";
import { getUnreadNotificationCountForUserId } from "@/server/notifications";

export async function AppNav() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  const isAdmin = session.user.role === "admin";
  const unreadNotifications = await getUnreadNotificationCountForUserId(session.user.id);

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white" href="/recommendations">
            Recommendations
          </Link>
          <Link className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white" href="/notifications">
            Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}
          </Link>
          <Link className="text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white" href="/account">
            My Account
          </Link>
          {isAdmin ? (
            <Link className="text-amber-700 hover:text-amber-900 dark:text-amber-400" href="/admin">
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex min-w-[12rem] flex-1 justify-end">
          <UserSearch />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
