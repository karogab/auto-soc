import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { requireAdminSession } from "@/lib/permissions";
import { listReportsForAdmin } from "@/server/reports";
import { updateReportStatusAction } from "@/actions/admin";
import { adminRemovePostFromFeedAction } from "@/actions/posts";

const statuses = ["new", "reviewed", "dismissed", "action_taken"] as const;

export default async function AdminReportsPage() {
  await requireAdminSession();
  const reports = await listReportsForAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reports</h1>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="p-2">Reporter</th>
              <th className="p-2">Author</th>
              <th className="p-2">Post preview</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Comment</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2">
                  <div>@{r.reporter.username}</div>
                  <div className="text-xs text-zinc-500">{r.reporter.email}</div>
                </td>
                <td className="p-2">
                  <div>@{r.post.author.username}</div>
                  <div className="text-xs text-zinc-500">{r.post.author.email}</div>
                </td>
                <td className="max-w-xs p-2 text-xs">
                  {r.post.text.length > 120 ? `${r.post.text.slice(0, 120)}…` : r.post.text}
                </td>
                <td className="p-2">{r.reason}</td>
                <td className="max-w-[8rem] p-2 text-xs">{r.comment ?? "—"}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2 text-xs">{formatDateTimeUtcPlus4(r.createdAt)}</td>
                <td className="space-y-2 p-2 align-top">
                  <form action={updateReportStatusAction} className="flex flex-col gap-1">
                    <input type="hidden" name="reportId" value={r.id} />
                    <select
                      name="status"
                      defaultValue={r.status}
                      className="rounded border border-zinc-300 text-xs dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded bg-zinc-800 px-2 py-1 text-xs text-white dark:bg-zinc-200 dark:text-zinc-900">
                      Update status
                    </button>
                  </form>
                  <form action={adminRemovePostFromFeedAction} className="flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                    <input type="hidden" name="postId" value={r.postId} />
                    <input type="hidden" name="mode" value="rejected" />
                    <button type="submit" className="text-xs text-rose-700 underline dark:text-rose-400">
                      Reject reported post
                    </button>
                  </form>
                  <form action={adminRemovePostFromFeedAction}>
                    <input type="hidden" name="postId" value={r.postId} />
                    <input type="hidden" name="mode" value="deleted" />
                    <button type="submit" className="text-xs text-zinc-600 underline dark:text-zinc-400">
                      Mark post deleted
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
