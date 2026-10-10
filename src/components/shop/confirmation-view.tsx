"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, PackageCheck, Receipt } from "lucide-react";
import { formatEGP } from "@/lib/utils";

const LAST_ORDER_KEY = "fltase3.lastOrder.v1";

interface LastOrder {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  phone: string;
}

let cachedRaw: string | null | undefined;
let cachedValue: LastOrder | null = null;

function readLastOrder(): LastOrder | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  cachedValue = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<LastOrder>;
      if (parsed.order_number) cachedValue = parsed as LastOrder;
    } catch {
      cachedValue = null;
    }
  }
  return cachedValue;
}

function subscribeNoop() {
  return () => {};
}

export function ConfirmationView() {
  const order = React.useSyncExternalStore(
    subscribeNoop,
    readLastOrder,
    () => null,
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-8 text-center shadow-hairline">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-surface-muted">
          <PackageCheck className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-foreground">No recent order found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you just placed an order, it&apos;s saved in this browser. Otherwise browse the shop for
          your next gift.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
        >
          Keep shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-card border border-border bg-surface p-8 text-center shadow-hairline">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-9" aria-hidden />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-foreground">
          Order placed — thank you!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your gift is being prepared. We&apos;ll call <strong>{order.phone}</strong> before
          delivery.
        </p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Order number
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary">
          {order.order_number}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Keep this number handy — you&apos;ll use it to track your gift.
        </p>

        <dl className="mx-auto mt-6 max-w-xs space-y-2.5 border-t border-border pt-5 text-left text-sm">
          <div className="flex justify-between">
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Receipt className="size-4" aria-hidden /> Subtotal
            </dt>
            <dd className="font-semibold tabular-nums">{formatEGP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-semibold tabular-nums">
              {order.delivery_fee === 0 ? "FREE" : formatEGP(order.delivery_fee)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="text-lg font-extrabold tabular-nums text-foreground">
              {formatEGP(order.total)}
            </dd>
          </div>
        </dl>

        <p className="mt-6 rounded-md bg-surface-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {order.delivery_fee > 0 ? "You'll pay" : "Nothing to pay now"} — this order is{" "}
          <strong>cash on delivery</strong>. A confirmation is also on its way by phone.
        </p>

        <Link
          href="/shop"
          className="mt-6 inline-flex items-center justify-center rounded-pill bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary/90"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}