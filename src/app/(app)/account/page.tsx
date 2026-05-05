import { requireSession } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { VerifiedBadge } from "@/components/verified-badge";
import { CreatePostForm } from "@/components/account/create-post-form";
import { ProfileStatsAvatar } from "@/components/profile-stats-avatar";
import { countApprovedCommentsForAuthor } from "@/server/comments";
import { countApprovedPostsForAuthor } from "@/server/posts";

export default async function AccountOverviewPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const [user, approvedPostCount, approvedCommentCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isVerified: true,
      },
    }),
    countApprovedPostsForAuthor(userId),
    countApprovedCommentsForAuthor(userId),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Profile information</h2>
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <ProfileStatsAvatar
            approvedPostCount={approvedPostCount}
            approvedCommentCount={approvedCommentCount}
          />
          <div className="min-w-0 w-full flex-1 space-y-2 text-center sm:text-left">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Email: <span className="font-mono text-zinc-800 dark:text-zinc-200">{user.email}</span> (cannot be changed
              in this MVP)
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
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">@{user.username}</span> —{" "}
              {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      </section>
      <CreatePostForm />
    </div>
  );
}
