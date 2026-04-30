import Link from "next/link";
import { requireAdminSession } from "@/lib/permissions";
import { listPostsForAdminSearch } from "@/server/posts";
import { PostText } from "@/components/post-text";
import { AdminDeletePostForm } from "@/components/admin-delete-post-form";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminPostsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const posts = await listPostsForAdminSearch(q, 100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Posts</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Search post body (any status). Leave empty to show the 100 most recent posts.
      </p>
      <form className="flex max-w-xl gap-2" method="get">
        <input
          name="q"
          placeholder="Search in post text…"
          defaultValue={q ?? ""}
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Search
        </button>
      </form>
      {posts.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No posts match.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="p-2 font-medium">When</th>
                <th className="p-2 font-medium">Author</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Text</th>
                <th className="p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2 text-xs text-zinc-500">
                    {p.createdAt.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="p-2">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.author.username}</div>
                    <div className="text-xs text-zinc-500">{p.author.email}</div>
                    <Link
                      href={`/admin/users/${p.author.id}`}
                      className="text-xs text-blue-600 underline dark:text-blue-400"
                    >
                      User
                    </Link>
                  </td>
                  <td className="whitespace-nowrap p-2">{p.status}</td>
                  <td className="max-w-md p-2">
                    <div className="max-h-36 overflow-y-auto text-zinc-800 dark:text-zinc-200">
                      <PostText text={p.text} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-2">
                    <AdminDeletePostForm postId={p.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
