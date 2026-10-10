"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import {
  updateOrderStatus,
  updatePaymentStatus,
  type OrderActionState,
} from "@/app/admin/(protected)/orders/actions";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

function Feedback({ state }: { state: OrderActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-xs font-medium text-success">
        Saved.
      </p>
    );
  }
  return null;
}

export function OrderActions({
  orderId,
  status,
  paymentStatus,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  const [statusState, statusAction, statusPending] = useActionState<OrderActionState, FormData>(
    updateOrderStatus,
    null,
  );
  const [paymentState, paymentAction, paymentPending] = useActionState<OrderActionState, FormData>(
    updatePaymentStatus,
    null,
  );

  return (
    <div className="space-y-6">
      <form action={statusAction} className="space-y-4">
        <input type="hidden" name="orderId" value={orderId} />
        <Field label="Order status" htmlFor="order-status">
          <Select id="order-status" name="status" defaultValue={status}>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Note (optional)" htmlFor="order-note">
          <Textarea
            id="order-note"
            name="note"
            rows={2}
            placeholder="e.g. Confirmed with the customer by phone"
            className="min-h-0"
          />
        </Field>
        <Feedback state={statusState} />
        <Button type="submit" className="w-full" disabled={statusPending}>
          {statusPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Update status
        </Button>
      </form>

      <form action={paymentAction} className="space-y-4 border-t border-border pt-6">
        <input type="hidden" name="orderId" value={orderId} />
        <Field label="Payment status" htmlFor="payment-status">
          <Select id="payment-status" name="status" defaultValue={paymentStatus}>
            {PAYMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PAYMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Feedback state={paymentState} />
        <Button type="submit" variant="outline" className="w-full" disabled={paymentPending}>
          {paymentPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Update payment
        </Button>
      </form>
    </div>
  );
}
