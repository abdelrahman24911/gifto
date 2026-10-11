"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  CalendarDays,
  Heart,
  LogOut,
  Package,
  Phone,
  Save,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { APP_TIME_ZONE, formatEGP } from "@/lib/utils";
import type { AccountSummary } from "@/lib/data/account";
import { signOutAccount, updateProfile, type ProfileState } from "@/app/(store)/account/actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<string, "warning" | "info" | "primary" | "success" | "destructive"> = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "destructive",
};

export function AccountContent({
  customer,
  orders,
}: {
  customer: AccountSummary["customer"];
  orders: AccountSummary["orders"];
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
      <div className="space-y-6">
        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-primary-soft text-lg font-extrabold text-primary">
                {initial(customer.full_name ?? "U")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-foreground">
                  {customer.full_name}
                </p>
                <p className="truncate text-sm text-muted-foreground">{customer.email ?? "—"}</p>
              </div>
            </div>
          </div>

          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden />
              {customer.phone ?? "No phone"}
            </li>
          </ul>
        </section>

        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
            Quick links
          </h2>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/track" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary">
                <Truck className="size-4 text-muted-foreground" aria-hidden /> Track an order
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary">
                <Heart className="size-4 text-muted-foreground" aria-hidden /> My wishlist
              </Link>
            </li>
            <li>
              <Link href="/shop" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-primary">
                <Package className="size-4 text-muted-foreground" aria-hidden /> Shop gifts
              </Link>
            </li>
          </ul>

          <form action={signOutAccount} className="mt-4 border-t border-border pt-4">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </form>
        </section>

        <UpdateProfileCard customer={customer} />
      </div>

      <div className="min-w-0">
        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-muted-foreground">Your orders</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight text-foreground">
                Order history
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-md bg-surface-muted px-5 py-8 text-center">
              <p className="text-sm font-semibold text-foreground">No orders yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Orders made with your email are automatically linked to this account.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block rounded-pill bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                Browse gifts
              </Link>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-foreground">{order.order_number}</p>
                      <Badge variant={STATUS_BADGE[order.status] ?? "neutral"} size="sm">
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground" suppressHydrationWarning>
                      <CalendarDays className="size-3.5" aria-hidden />
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: APP_TIME_ZONE,
                      })}
                      {order.item_count > 0 ? ` · ${order.item_count} items` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-extrabold tabular-nums text-foreground">
                      {formatEGP(order.total)}
                    </p>
                    <Link
                      href={`/track?order=${encodeURIComponent(order.order_number)}&phone=${encodeURIComponent(customer.phone ?? "")}`}
                      className="rounded-pill border border-border px-3.5 py-2 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-primary-soft"
                    >
                      Track
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function initial(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "U").toUpperCase();
}

function UpdateProfileCard({ customer }: { customer: AccountSummary["customer"] }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null,
  );

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
      <h2 className="text-sm font-extrabold uppercase tracking-widest text-foreground">
        Profile details
      </h2>
      <form action={formAction} className="mt-4 space-y-4">
        <Field label="Full name" htmlFor="account_name" required>
          <Input
            id="account_name"
            name="full_name"
            defaultValue={customer.full_name ?? ""}
            autoComplete="name"
            disabled={pending}
            required
          />
        </Field>
        <Field label="Phone" htmlFor="account_phone" required hint="Used for delivery calls.">
          <Input
            id="account_phone"
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={customer.phone ?? ""}
            autoComplete="tel"
            disabled={pending}
            required
          />
        </Field>
        {state?.error ? (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-xs font-medium text-success">
            Saved.
          </p>
        ) : null}
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </section>
  );
}