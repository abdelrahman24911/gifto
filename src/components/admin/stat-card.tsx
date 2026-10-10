import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "success" | "warning" | "info" | "destructive";

const tones: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
  destructive: "bg-destructive-soft text-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-hairline">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">
          {label}
        </p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-pill", tones[tone])}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
