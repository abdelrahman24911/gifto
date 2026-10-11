"use client";

import * as React from "react";
import { useActionState } from "react";
import { CalendarDays, Check, CreditCard, MapPin, PackageSearch, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { APP_TIME_ZONE, formatEGP } from "@/lib/utils";
import type { TrackedOrder } from "@/lib/data/track";
import type { TrackLookupState } from "@/app/(store)/track/actions";
import { lookupTrackedOrder } from "@/app/(store)/track/actions";

const STATUS_STEPS = [
  { key: "pending", label: "Awaiting confirmation" },
  { key: "confirmed", label: "Order confirmed" },
  { key: "preparing", label: "Being prepared" },
  { key: "shipped", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const STATUS_BADGE: Record<string, "warning" | "info" | "primary" | "success" | "destructive"> = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const INITIAL: TrackLookupState = { kind: "idle" };

export function TrackOrderView({
  defaultOrder = "",
  defaultPhone = "",
}: {
  defaultOrder?: string;
  defaultPhone?: string;
}) {
  const [state, formAction, pending] = useActionState(lookupTrackedOrder, INITIAL);

  return (
    <div className="mx-auto max-w-2xl">
      <form action={formAction} noValidate className="rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order number" htmlFor="order_number" required>
            <Input
              id="order_number"
              name="order_number"
              defaultValue={defaultOrder}
              placeholder="e.g. FT-1015"
              autoCapitalize="characters"
              disabled={pending}
            />
          </Field>
          <Field label="Phone used at checkout" htmlFor="phone" required>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaultPhone}
              placeholder="01xxxxxxxxx"
              disabled={pending}
            />
          </Field>
        </div>
        <Button type="submit" className="mt-5 w-full" size="lg" disabled={pending}>
          {pending ? "Looking up…" : "Track my order"}
        </Button>
      </form>

      {state.kind === "empty" || state.kind === "error" ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.kind === "not-found" ? (
        <div className="mt-6 rounded-card border border-border bg-surface p-8 text-center shadow-hairline">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-muted">
            <PackageSearch className="size-7 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="mt-4 text-lg font-extrabold text-foreground">No order matched</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Double-check the order number and the phone you used at checkout. Our team can also
            help on WhatsApp.
          </p>
        </div>
      ) : null}

      {state.kind === "ok" ? <TrackedOrderCard order={state.order} /> : null}
    </div>
  );
}

function TrackedOrderCard({ order }: { order: TrackedOrder }) {
  const currentIndex = STATUS_STEPS.findIndex((step) => step.key === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-hairline sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Order</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {order.order_number}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={STATUS_BADGE[order.status] ?? "neutral"}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            Placed{" "}
          {new Date(order.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: APP_TIME_ZONE,
          })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4" aria-hidden />
          {order.governorate}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CreditCard className="size-4" aria-hidden />
          {order.payment_status === "cash_on_delivery" ? "Cash on delivery" : "Payment " + order.payment_status}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Truck className="size-4" aria-hidden />
          {order.total > 0 ? formatEGP(order.total) : "—"}
        </span>
      </div>

      {cancelled ? (
        <div className="mt-6 rounded-md bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          This order was cancelled. If you think that&apos;s a mistake, message us on WhatsApp and
          we&apos;ll look into it.
        </div>
      ) : (
        <ol className="mt-7 space-y-0">
          {STATUS_STEPS.map((step, index) => {
            const done = currentIndex > index;
            const active = currentIndex === index;
            return (
              <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                {index < STATUS_STEPS.length - 1 ? (
                  <span
                    className={`absolute left-[11px] top-7 h-[calc(100%-1.25rem)] w-0.5 ${
                      done || active ? "bg-primary" : "bg-border"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    done
                      ? "border-primary bg-primary text-white"
                      : active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-surface text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {done ? <Check className="size-3.5" /> : active ? <CalendarDays className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                </span>
                <div className="pt-0.5">
                  <p className={`text-sm font-bold ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  {active ? (
                    <p className="mt-0.5 text-xs font-semibold text-primary">
                      {index === STATUS_STEPS.length - 1 ? "Enjoy your gift!" : "Current step"}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-7 border-t border-border pt-5">
        <h3 className="text-sm font-extrabold text-foreground">What&apos;s inside</h3>
        <ul className="mt-3 space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.name} <span className="text-foreground">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatEGP(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-extrabold tabular-nums text-foreground">{formatEGP(order.total)}</span>
        </div>
      </div>
    </div>
  );
}