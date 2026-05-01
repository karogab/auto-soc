import { requireSession } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  countUnreadNotificationsForRecipient,
  listNotificationsForRecipient,
  markAllNotificationsReadForRecipient,
  markNotificationReadForRecipient,
} from "@/server/notification-sql";

const PREVIEW_LEN = 80;

export type NotificationListItem = {
  id: string;
  type: "like" | "dislike";
  isRead: boolean;
  createdAt: Date;
  actor: {
    username: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
  };
  post: {
    id: string;
    textPreview: string;
  };
};

function previewText(text: string): string {
  const t = text.trim();
  if (t.length <= PREVIEW_LEN) {
    return t;
  }
  return `${t.slice(0, PREVIEW_LEN)}…`;
}

export async function getMyNotifications(): Promise<NotificationListItem[]> {
  const session = await requireSession();
  const rows = await listNotificationsForRecipient(prisma, session.user.id);

  return rows.map((n) => ({
    id: n.id,
    type: n.notif_type === "like" ? "like" : "dislike",
    isRead: n.isRead,
    createdAt: n.createdAt,
    actor: {
      username: n.actor_username,
      firstName: n.actor_firstName,
      lastName: n.actor_lastName,
      isVerified: n.actor_isVerified,
    },
    post: { id: n.post_id, textPreview: previewText(n.post_text) },
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await requireSession();
  return countUnreadNotificationsForRecipient(prisma, session.user.id);
}

/** For layouts that already have `session.user.id` from `auth()` — same query as {@link getUnreadNotificationCount}. */
export async function getUnreadNotificationCountForUserId(userId: string): Promise<number> {
  return countUnreadNotificationsForRecipient(prisma, userId);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const session = await requireSession();
  await markNotificationReadForRecipient(prisma, notificationId, session.user.id);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const session = await requireSession();
  await markAllNotificationsReadForRecipient(prisma, session.user.id);
}
