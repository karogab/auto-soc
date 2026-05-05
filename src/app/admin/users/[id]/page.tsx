import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTimeUtcPlus4 } from "@/lib/datetime";
import { requireAdminSession } from "@/lib/permissions";
import {
  getUserDetailForAdmin,
  listReactionHistoryForAdmin,
} from "@/server/users";
import { listPostsForAdminByAuthor } from "@/server/posts";
import { PostText } from "@/components/post-text";
import { VerificationToggle } from "@/components/admin-verification-toggle";
import { AdminDeleteUserForm } from "@/components/admin-delete-user-form";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ userError?: string }>;
};

export default async function AdminUserDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = await searchParams;
  const user = await getUserDetailForAdmin(id);
  if (!user) {
    notFound();
  }
  const posts = await listPostsForAdminByAuthor(id);
  const reactions = await listReactionHistoryForAdmin(id);

  return (
    <div className="space-y-8">
      <Link href="/admin/users" className="text-sm text-blue-600 underline dark:text-blue-400">
        ← Users
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">User: {user.username}</h1>
      <section className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Name</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Verified</dt>
            <dd>{user.isVerified ? "yes" : "no"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Joined</dt>
            <dd>{formatDateTimeUtcPlus4(user.createdAt)}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <VerificationToggle userId={user.id} isVerified={user.isVerified} />
        </div>
        {sp.userError === "cannot_delete_self" ? (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">You cannot delete your own account.</p>
        ) : null}
        {sp.userError === "last_admin" ? (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            Cannot delete the only admin account. Promote another user to admin first.
          </p>
        ) : null}
        <AdminDeleteUserForm userId={user.id} />
      </section>

      <section>
        <h2 className="text-lg font-medium">Posts</h2>
        <div className="mt-2 overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="p-2">Text</th>
                <th className="p-2">Status</th>
                <th className="p-2">Likes</th>
                <th className="p-2">Dislikes</th>
                <th className="p-2">Reports</th>
                <th className="p-2">Created</th>
                <th className="p-2">Approved</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="max-w-xs p-2">
                    <PostText text={p.text.length > 200 ? `${p.text.slice(0, 200)}…` : p.text} />
                  </td>
                  <td className="p-2">{p.status}</td>
                  <td className="p-2">{p.likeCount}</td>
                  <td className="p-2">{p.dislikeCount}</td>
                  <td className="p-2">{p.reportCount}</td>
                  <td className="p-2 text-xs">{formatDateTimeUtcPlus4(p.createdAt)}</td>
                  <td className="p-2 text-xs">{p.approvedAt ? formatDateTimeUtcPlus4(p.approvedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Reaction history</h2>
        <div className="mt-2 overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">Date</th>
                <th className="p-2">Post author</th>
                <th className="p-2">Post preview</th>
              </tr>
            </thead>
            <tbody>
              {reactions.map((r) => (
                <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-2">{r.type}</td>
                  <td className="p-2 text-xs">{formatDateTimeUtcPlus4(r.createdAt)}</td>
                  <td className="p-2">
                    @{r.post.author.username} ({r.post.author.firstName} {r.post.author.lastName})
                  </td>
                  <td className="max-w-xs p-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {r.post.text.slice(0, 120)}
                    {r.post.text.length > 120 ? "…" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
