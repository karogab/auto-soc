import Link from "next/link";
import { redirect } from "next/navigation";
import { PermissionError, requireAdminSession } from "@/lib/permissions";

const links = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/suggestions", label: "Suggestions" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdminSession();
  } catch (e) {
    if (e instanceof PermissionError) {
      redirect("/login?callbackUrl=/admin");
    }
    throw e;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900 md:w-52 md:border-b-0 md:border-r">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Admin</p>
        <nav className="mt-3 flex flex-col gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-2 py-1 text-zinc-800 hover:bg-zinc-200 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/recommendations" className="mt-4 text-zinc-600 underline dark:text-zinc-400">
            Back to app
          </Link>
        </nav>
      </aside>
      <div className="flex-1 bg-white p-6 dark:bg-zinc-950">{children}</div>
    </div>
  );
}
