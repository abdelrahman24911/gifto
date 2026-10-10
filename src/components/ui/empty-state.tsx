import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface px-6 text-center",
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-pill bg-primary-soft text-primary">
        {icon ?? <GiftIcon />}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-7" aria-hidden>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      <path d="M12 8S9.5 3 7.5 4.5 9 8 12 8Zm0 0s2.5-5 4.5-3.5S15 8 12 8Z" />
    </svg>
  );
}

/** Inline error block used for failed requests. */
export function ErrorState({
  title = "Something went wrong.",
  description = "Try again in a moment.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-destructive/30 bg-destructive-soft px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-pill bg-destructive/10 text-destructive">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-destructive">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-destructive/80">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
