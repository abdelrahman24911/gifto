import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>["variant"]>;

const ORDER_VARIANTS: Record<OrderStatus, BadgeVariant> = {
  pending: "warning",
  confirmed: "info",
  preparing: "accent",
  shipped: "primary",
  delivered: "success",
  cancelled: "destructive",
};

const PAYMENT_VARIANTS: Record<PaymentStatus, BadgeVariant> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
  cash_on_delivery: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={ORDER_VARIANTS[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={PAYMENT_VARIANTS[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

const INVENTORY_VARIANTS: Record<string, BadgeVariant> = {
  healthy: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
};

const INVENTORY_LABELS: Record<string, string> = {
  healthy: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export function InventoryStatusBadge({ status }: { status: string | null }) {
  const key = status ?? "healthy";
  return (
    <Badge variant={INVENTORY_VARIANTS[key] ?? "neutral"}>
      {INVENTORY_LABELS[key] ?? key}
    </Badge>
  );
}
