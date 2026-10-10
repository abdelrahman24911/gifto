"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ExternalLink,
  Gift,
  Menu,
  Package,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSignOut } from "@/app/admin/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

interface AdminShellProps {
  profile: { full_name: string | null; email: string; role: string };
  children: React.ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const close = React.useCallback(() => setOpen(false), []);

  const displayName = profile.full_name?.trim() || profile.email;

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-pill px-3.5 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-hairline"
                : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2 py-1">
        <span className="grid size-9 place-items-center rounded-pill bg-primary text-primary-foreground">
          <Gift className="size-5" aria-hidden />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-tight">FL Tase3</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Admin
          </span>
        </span>
      </Link>

      <div className="mt-6 flex-1">{nav}</div>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <div className="px-1">
          <p className="truncate text-sm font-bold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.role === "admin" ? "Administrator" : "Staff"}
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ExternalLink className="size-4" aria-hidden />
          View store
        </Link>
        <form action={adminSignOut}>
          <button
            type="submit"
            className="w-full rounded-pill border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-border-strong hover:bg-surface-muted"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border bg-surface px-4 py-5 lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-border bg-surface px-4 py-5 shadow-pop">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-pill border border-border bg-surface"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="font-extrabold tracking-tight">FL Tase3 Admin</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className={cn("ml-auto grid size-10 place-items-center rounded-pill", open ? "" : "hidden")}
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-title font-extrabold tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
