import { BadgeCheck } from "lucide-react";

export type VerifiedBadgeProps = {
  className?: string;
  title?: string;
  "aria-label"?: string;
  size?: "sm" | "md";
};

const sizeClass: Record<NonNullable<VerifiedBadgeProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

export function VerifiedBadge({
  className = "",
  title = "Verified",
  "aria-label": ariaLabel,
  size = "md",
}: VerifiedBadgeProps) {
  return (
    <span title={title} className={`inline-flex shrink-0 align-text-bottom ${className}`.trim()}>
      <BadgeCheck
        className={`text-emerald-600 dark:text-emerald-400 ${sizeClass[size]}`}
        strokeWidth={2}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
      />
    </span>
  );
}
