import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "muted" | "ink";
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-14 sm:py-16 lg:py-20",
        tone === "muted" && "bg-surface-muted/60",
        tone === "ink" && "bg-foreground text-white",
        className,
      )}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  action?: { href: string; label: string };
  align?: "start" | "center";
  tone?: "default" | "ink";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-10",
        align === "center" && "flex-col items-center text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className={cn("eyebrow", tone === "ink" ? "text-accent" : "text-primary")}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "mt-2.5 text-title font-extrabold tracking-tight",
            tone === "ink" ? "text-white" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-3 text-base leading-relaxed",
              tone === "ink" ? "text-white/70" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <Link
          href={action.href}
          className={cn(
            "group inline-flex items-center gap-1.5 text-sm font-bold transition-colors",
            tone === "ink" ? "text-accent hover:text-white" : "text-primary hover:text-primary-hover",
          )}
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
