import { requireAdminSession } from "@/lib/permissions";
import { listQuestionsForAdmin } from "@/server/questions";
import { updateQuestionStatusAction } from "@/actions/admin";

const statuses = ["new", "read", "answered"] as const;

export default async function AdminQuestionsPage() {
  await requireAdminSession();
  const rows = await listQuestionsForAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Questions</h1>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Email</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Message</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={q.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2">@{q.user.username}</td>
                <td className="p-2 text-xs">{q.user.email}</td>
                <td className="p-2">{q.subject ?? "—"}</td>
                <td className="max-w-xs p-2 text-xs">{q.message}</td>
                <td className="p-2">{q.status}</td>
                <td className="p-2 text-xs">{q.createdAt.toLocaleString()}</td>
                <td className="p-2">
                  <form action={updateQuestionStatusAction} className="flex flex-col gap-1">
                    <input type="hidden" name="questionId" value={q.id} />
                    <select
                      name="status"
                      defaultValue={q.status}
                      className="rounded border border-zinc-300 text-xs dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded bg-zinc-800 px-2 py-1 text-xs text-white dark:bg-zinc-200 dark:text-zinc-900">
                      Update
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
