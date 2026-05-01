"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notifications";

type MarkOneReadButtonProps = {
  notificationId: string;
  disabled?: boolean;
};

export function MarkNotificationReadButton({ notificationId, disabled }: MarkOneReadButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        start(async () => {
          await markNotificationAsReadAction(notificationId);
          router.refresh();
        });
      }}
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      Mark as read
    </button>
  );
}

type MarkAllReadButtonProps = {
  disabled?: boolean;
};

export function MarkAllNotificationsReadButton({ disabled }: MarkAllReadButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        start(async () => {
          await markAllNotificationsAsReadAction();
          router.refresh();
        });
      }}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      Mark all as read
    </button>
  );
}
