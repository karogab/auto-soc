import Link from "next/link";
import { requireAdminSession } from "@/lib/permissions";
import { listUsersForAdmin } from "@/server/users";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = await searchParams;
  const users = await listUsersForAdmin(typeof sp.q === "string" ? sp.q : undefined);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Users</h1>
      <form className="flex max-w-md gap-2" method="get">
        <input
          name="q"
          placeholder="Search email, username, name…"
          defaultValue={sp.q ?? ""}
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
        <button type="submit" className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Search
        </button>
      </form>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="p-2 font-medium">ID</th>
              <th className="p-2 font-medium">Username</th>
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Email</th>
              <th className="p-2 font-medium">Role</th>
              <th className="p-2 font-medium">Verified</th>
              <th className="p-2 font-medium">Posts</th>
              <th className="p-2 font-medium">Joined</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2 font-mono text-xs text-zinc-500">{u.id.slice(0, 8)}…</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">
                  {u.firstName} {u.lastName}
                </td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.isVerified ? "yes" : "no"}</td>
                <td className="p-2">{u._count.posts}</td>
                <td className="p-2 text-xs text-zinc-500">{u.createdAt.toLocaleDateString()}</td>
                <td className="p-2">
                  <Link href={`/admin/users/${u.id}`} className="text-blue-600 underline dark:text-blue-400">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
