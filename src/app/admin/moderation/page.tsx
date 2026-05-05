import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { requireAdminSession } from "@/lib/permissions";
import { listPendingPostsForModeration } from "@/server/posts";
import { PostText } from "@/components/post-text";
import { approvePostAction, rejectPostAction } from "@/actions/posts";

export default async function AdminModerationPage() {
  await requireAdminSession();
  const posts = await listPendingPostsForModeration();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Moderation</h1>
      {posts.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No pending posts.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                @{p.author.username} · {p.author.firstName} {p.author.lastName} ·{" "}
                <span className="font-mono text-xs">{p.author.email}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatDateTimeUtcPlus4(p.createdAt)}</p>
              <div className="mt-2">
                <PostText text={p.text} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={approvePostAction}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    type="submit"
                    className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectPostAction}>
                  <input type="hidden" name="postId" value={p.id} />
                  <button
                    type="submit"
                    className="rounded bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
