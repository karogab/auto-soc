"use client";

import { VerifiedBadge } from "@/components/verified-badge";

export function VerificationSection({
  verificationUrl,
  isVerified,
}: {
  verificationUrl: string | null;
  isVerified: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Verification</h2>
      {isVerified ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
          <VerifiedBadge size="sm" />
          You are verified
        </p>
      ) : verificationUrl ? (
        <a
          href={verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Request verification
        </a>
      ) : (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Verification form URL is not configured. Set NEXT_PUBLIC_VERIFICATION_FORM_URL for your deployment.
        </p>
      )}
    </div>
  );
}
