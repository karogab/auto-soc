import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { requireAdminSession } from "@/lib/permissions";
import { listSuggestionsForAdmin } from "@/server/suggestions";
import { updateSuggestionStatusAction } from "@/actions/admin";

const statuses = ["new", "reviewed", "planned", "rejected"] as const;

export default async function AdminSuggestionsPage() {
  await requireAdminSession();
  const rows = await listSuggestionsForAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Suggestions</h1>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Email</th>
              <th className="p-2">Message</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2">@{s.user.username}</td>
                <td className="p-2 text-xs">{s.user.email}</td>
                <td className="max-w-md p-2 text-xs">{s.message}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2 text-xs">{formatDateTimeUtcPlus4(s.createdAt)}</td>
                <td className="p-2">
                  <form action={updateSuggestionStatusAction} className="flex flex-col gap-1">
                    <input type="hidden" name="suggestionId" value={s.id} />
                    <select
                      name="status"
                      defaultValue={s.status}
                      className="rounded border border-zinc-300 text-xs dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
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
