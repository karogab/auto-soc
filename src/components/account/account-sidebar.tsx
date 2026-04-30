"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/verification", label: "Verification" },
  { href: "/account/posts", label: "Posts" },
  { href: "/account/support", label: "Support" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/account") {
    return pathname === "/account";
  }
  return pathname === href;
}

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-zinc-200 pb-3 dark:border-zinc-800 lg:w-44 lg:flex-col lg:gap-0 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
    >
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors lg:px-3 ${
              active
                ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
