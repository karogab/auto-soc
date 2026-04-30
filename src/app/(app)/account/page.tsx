import { requireSession } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { VerifiedBadge } from "@/components/verified-badge";
import { CreatePostForm } from "@/components/account/create-post-form";

export default async function AccountOverviewPage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isVerified: true,
    },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Profile information</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Email: <span className="font-mono text-zinc-800 dark:text-zinc-200">{user.email}</span> (cannot be changed in
          this MVP)
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Verification status:{" "}
          {user.isVerified ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              Verified
              <VerifiedBadge size="sm" />
            </span>
          ) : (
            <span>Not verified</span>
          )}
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">@{user.username}</span> —{" "}
          {user.firstName} {user.lastName}
        </p>
      </section>
      <CreatePostForm />
    </div>
  );
}
