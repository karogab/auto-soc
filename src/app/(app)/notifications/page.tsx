import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { getMyNotifications, getUnreadNotificationCount } from "@/server/notifications";
import { VerifiedBadge } from "@/components/verified-badge";
import {
  MarkAllNotificationsReadButton,
  MarkNotificationReadButton,
} from "@/components/notifications/notification-actions";

export default async function NotificationsPage() {
  await requireSession();
  const [items, unreadCount] = await Promise.all([getMyNotifications(), getUnreadNotificationCount()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {unreadCount > 0 ? (
              <>
                You have <span className="font-medium text-zinc-900 dark:text-zinc-100">{unreadCount}</span> unread
                notification{unreadCount === 1 ? "" : "s"}.
              </>
            ) : (
              "No unread notifications."
            )}
          </p>
        </div>
        {items.length > 0 && unreadCount > 0 ? <MarkAllNotificationsReadButton /> : null}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          You have no notifications yet. When someone likes or dislikes your post, it will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const verb = n.type === "like" ? "liked" : "disliked";
            const when = n.createdAt.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <li
                key={n.id}
                className={`rounded-lg border p-4 transition-colors ${
                  n.isRead
                    ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                    : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm text-zinc-900 dark:text-zinc-100">
                      <span className="font-medium">
                        {n.actor.firstName} {n.actor.lastName}
                      </span>{" "}
                      <span className="text-zinc-600 dark:text-zinc-400">
                        (@{n.actor.username})
                        {n.actor.isVerified ? (
                          <>
                            {" "}
                            <VerifiedBadge size="sm" className="inline align-middle" aria-label="Verified" />
                          </>
                        ) : null}
                      </span>{" "}
                      <span className="text-zinc-800 dark:text-zinc-200">{verb} your post</span>
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Post:</span> {n.post.textPreview}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">{when}</p>
                    <p>
                      <Link
                        href="/recommendations"
                        className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                      >
                        View recommendations
                      </Link>
                    </p>
                  </div>
                  {!n.isRead ? <MarkNotificationReadButton notificationId={n.id} /> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
