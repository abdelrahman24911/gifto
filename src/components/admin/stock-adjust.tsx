"use client";

import * as React from "react";
import { Loader2, Minus, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  restockProduct,
  setStockLevel,
  type StockState,
} from "@/app/admin/(protected)/inventory/actions";

export function StockAdjust({
  productId,
  productName,
  stockQuantity,
}: {
  productId: string;
  productName: string;
  stockQuantity: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"restock" | "set">("restock");

  const close = React.useCallback(() => setOpen(false), []);

  const restock = React.useCallback(
    async (prev: StockState, formData: FormData) => {
      const result = await restockProduct(prev, formData);
      if (result?.ok) close();
      return result;
    },
    [close],
  );

  const adjust = React.useCallback(
    async (prev: StockState, formData: FormData) => {
      const result = await setStockLevel(prev, formData);
      if (result?.ok) close();
      return result;
    },
    [close],
  );

  const [restockState, restockAction, restockPending] = React.useActionState<StockState, FormData>(
    restock,
    null,
  );
  const [setStockState, setStockAction, setStockPending] = React.useActionState<StockState, FormData>(
    adjust,
    null,
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PackagePlus className="size-4" aria-hidden />
        Update stock
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Update stock"
        description={productName}
        size="sm"
        busy={restockPending || setStockPending}
      >
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-pill bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setMode("restock")}
            className={
              mode === "restock"
                ? "rounded-pill bg-surface px-3 py-1.5 text-sm font-bold shadow-hairline"
                : "rounded-pill px-3 py-1.5 text-sm font-semibold text-muted-foreground"
            }
          >
            Add stock
          </button>
          <button
            type="button"
            onClick={() => setMode("set")}
            className={
              mode === "set"
                ? "rounded-pill bg-surface px-3 py-1.5 text-sm font-bold shadow-hairline"
                : "rounded-pill px-3 py-1.5 text-sm font-semibold text-muted-foreground"
            }
          >
            Set exact
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Current stock: <span className="font-bold text-foreground">{stockQuantity}</span>
        </p>

        {mode === "restock" ? (
          <form action={restockAction} className="space-y-4">
            <input type="hidden" name="productId" value={productId} />
            <Field label="Quantity to add" htmlFor="quantity" required>
              <Input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue="1" required autoFocus />
            </Field>
            <Field label="Note (optional)" htmlFor="restock-note">
              <Input id="restock-note" name="note" placeholder="e.g. New delivery" />
            </Field>
            {restockState?.error ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {restockState.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={restockPending}>
              {restockPending ? <Loader2 className="animate-spin" aria-hidden /> : <PackagePlus className="size-[18px]" aria-hidden />}
              Add stock
            </Button>
          </form>
        ) : (
          <form action={setStockAction} className="space-y-4">
            <input type="hidden" name="productId" value={productId} />
            <Field label="New stock count" htmlFor="newStock" required>
              <Input id="newStock" name="newStock" type="number" min="0" step="1" defaultValue={stockQuantity} required autoFocus />
            </Field>
            <Field label="Reason" htmlFor="reason" required hint="Recorded against the stock movement.">
              <Textarea id="reason" name="reason" rows={2} className="min-h-0" placeholder="e.g. Stock count correction" required />
            </Field>
            {setStockState?.error ? (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {setStockState.error}
              </p>
            ) : null}
            <Button type="submit" variant="accent" className="w-full" disabled={setStockPending}>
              {setStockPending ? <Loader2 className="animate-spin" aria-hidden /> : <Minus className="size-[18px]" aria-hidden />}
              Set stock count
            </Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
