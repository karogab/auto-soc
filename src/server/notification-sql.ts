import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Prisma root or interactive transaction client: raw SQL only (works before `prisma generate` adds delegates). */
export type SqlExecutor = Pick<PrismaClient, "$queryRaw" | "$executeRaw">;

export async function countUnreadNotificationsForRecipient(
  db: SqlExecutor,
  recipientId: string,
): Promise<number> {
  const rows = await db.$queryRaw<Array<{ c: bigint }>>`
    SELECT COUNT(*)::bigint AS c
    FROM "Notification" n
    INNER JOIN "Post" p ON p."id" = n."postId"
    WHERE n."recipientId" = ${recipientId}
      AND n."isRead" = false
      AND p."status" = 'approved'
  `;
  return Number(rows[0]?.c ?? 0);
}

export type NotificationListRow = {
  id: string;
  notif_type: string;
  isRead: boolean;
  createdAt: Date;
  actor_username: string;
  actor_firstName: string;
  actor_lastName: string;
  actor_isVerified: boolean;
  post_id: string;
  post_text: string;
};

export async function listNotificationsForRecipient(
  db: SqlExecutor,
  recipientId: string,
): Promise<NotificationListRow[]> {
  return db.$queryRaw<NotificationListRow[]>`
    SELECT
      n."id",
      n."type"::text AS notif_type,
      n."isRead",
      n."createdAt",
      u."username" AS actor_username,
      u."firstName" AS actor_firstName,
      u."lastName" AS actor_lastName,
      u."isVerified" AS actor_isVerified,
      p."id" AS post_id,
      p."text" AS post_text
    FROM "Notification" n
    INNER JOIN "User" u ON u."id" = n."actorId"
    INNER JOIN "Post" p ON p."id" = n."postId"
    WHERE n."recipientId" = ${recipientId}
      AND p."status" = 'approved'
    ORDER BY n."createdAt" DESC
  `;
}

export async function markNotificationReadForRecipient(
  db: SqlExecutor,
  notificationId: string,
  recipientId: string,
): Promise<void> {
  await db.$executeRaw`
    UPDATE "Notification"
    SET "isRead" = true, "updatedAt" = NOW()
    WHERE "id" = ${notificationId} AND "recipientId" = ${recipientId}
  `;
}

export async function markAllNotificationsReadForRecipient(db: SqlExecutor, recipientId: string): Promise<void> {
  await db.$executeRaw`
    UPDATE "Notification" n
    SET "isRead" = true, "updatedAt" = NOW()
    FROM "Post" p
    WHERE n."postId" = p."id"
      AND n."recipientId" = ${recipientId}
      AND n."isRead" = false
      AND p."status" = 'approved'
  `;
}

export async function deleteNotificationsForPost(db: SqlExecutor, postId: string): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "Notification" WHERE "postId" = ${postId}
  `;
}

export async function deleteReactionNotification(
  db: SqlExecutor,
  recipientId: string,
  actorId: string,
  postId: string,
): Promise<void> {
  await db.$executeRaw`
    DELETE FROM "Notification"
    WHERE "recipientId" = ${recipientId} AND "actorId" = ${actorId} AND "postId" = ${postId}
  `;
}

export async function upsertReactionNotification(
  db: SqlExecutor,
  params: { recipientId: string; actorId: string; postId: string; type: "like" | "dislike" },
): Promise<void> {
  const id = randomUUID();
  if (params.type === "like") {
    await db.$executeRaw`
      INSERT INTO "Notification" ("id", "recipientId", "actorId", "postId", "type", "isRead", "createdAt", "updatedAt")
      VALUES (${id}, ${params.recipientId}, ${params.actorId}, ${params.postId}, 'like'::"NotificationType", false, NOW(), NOW())
      ON CONFLICT ("recipientId", "actorId", "postId")
      DO UPDATE SET
        "type" = EXCLUDED."type",
        "isRead" = false,
        "updatedAt" = NOW()
    `;
    return;
  }
  await db.$executeRaw`
    INSERT INTO "Notification" ("id", "recipientId", "actorId", "postId", "type", "isRead", "createdAt", "updatedAt")
    VALUES (${id}, ${params.recipientId}, ${params.actorId}, ${params.postId}, 'dislike'::"NotificationType", false, NOW(), NOW())
    ON CONFLICT ("recipientId", "actorId", "postId")
    DO UPDATE SET
      "type" = EXCLUDED."type",
      "isRead" = false,
      "updatedAt" = NOW()
  `;
}
