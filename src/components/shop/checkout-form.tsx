"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, Truck } from "lucide-react";
import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { checkoutSchema, deliveryFeeFor } from "@/lib/checkout";
import { GOVERNORATES, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatEGP } from "@/lib/utils";
import { placeOrder } from "@/app/(store)/checkout/actions";

const EMPTY = {
  full_name: "",
  phone: "",
  email: "",
  governorate: "",
  area: "",
  delivery_address: "",
  delivery_notes: "",
  gift_message: "",
  payment_method: "cash_on_delivery" as "cash_on_delivery" | "card",
};

const LAST_ORDER_KEY = "fltase3.lastOrder.v1";

export function CheckoutForm() {
  const { hydrated, lines, subtotal, clearCart } = useShop();
  const router = useRouter();
  const [values, setValues] = React.useState(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const governorate = GOVERNORATES.find((row) => row.slug === values.governorate);
  const freeShipping = subtotal >= FREE_DELIVERY_THRESHOLD;
  const delivery = freeShipping ? 0 : deliveryFeeFor(values.governorate, subtotal);
  const total = subtotal + delivery;

  const setField = (name: keyof typeof EMPTY) => (next: string) => {
    setValues((prev) => ({ ...prev, [name]: next }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const raw = {
      ...values,
      email: values.email || undefined,
      area: values.area || undefined,
      delivery_notes: values.delivery_notes || undefined,
      gift_message: values.gift_message || undefined,
      items: lines.map((line) => ({
        product_id: line.productId,
        quantity: line.quantity,
        personalization: Object.keys(line.personalization).length
          ? line.personalization
          : undefined,
      })),
    };

    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] && !next[String(issue.path[0])]) next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        items: parsed.data.items,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        governorate: parsed.data.governorate,
        area: parsed.data.area || undefined,
        delivery_address: parsed.data.delivery_address,
        delivery_notes: parsed.data.delivery_notes || undefined,
        gift_message: parsed.data.gift_message || undefined,
        payment_method: parsed.data.payment_method,
      });

      if (result.ok) {
        try {
          localStorage.setItem(
            LAST_ORDER_KEY,
            JSON.stringify({ ...result.order, phone: parsed.data.phone }),
          );
        } catch {
          /* private mode — confirmation will fall back to tracking */
        }
        clearCart();
        router.push("/order/confirmation");
      } else {
        setServerError(result.error);
      }
    });
  }

  if (hydrated && lines.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex items-center gap-2 rounded-pill bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
        >
          Browse gifts
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-8">
        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">1</span>
            Recipient details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="full_name" required error={errors.full_name} className="sm:col-span-2">
              <Input
                id="full_name"
                autoComplete="name"
                value={values.full_name}
                onChange={(e) => setField("full_name")(e.target.value)}
                invalid={Boolean(errors.full_name)}
                placeholder="Who is this gift for?"
                disabled={pending}
              />
            </Field>
            <Field label="Phone (WhatsApp)" htmlFor="phone" required error={errors.phone} hint="The delivery team will call this number.">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={(e) => setField("phone")(e.target.value)}
                invalid={Boolean(errors.phone)}
                placeholder="01xxxxxxxxx"
                disabled={pending}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email} hint="Optional — for your order confirmation.">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setField("email")(e.target.value)}
                invalid={Boolean(errors.email)}
                placeholder="you@example.com"
                disabled={pending}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">2</span>
            Delivery address
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Governorate" htmlFor="governorate" required error={errors.governorate}>
              <Select
                id="governorate"
                value={values.governorate}
                onChange={(e) => setField("governorate")(e.target.value)}
                invalid={Boolean(errors.governorate)}
                disabled={pending}
              >
                <option value="">Choose governorate</option>
                {GOVERNORATES.map((row) => (
                  <option key={row.slug} value={row.slug}>
                    {row.name} — {formatEGP(row.fee)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Area / City" htmlFor="area" error={errors.area} hint="Optional — pick from the list.">
              <Input
                id="area"
                list="fl-area-options"
                value={values.area}
                onChange={(e) => setField("area")(e.target.value)}
                invalid={Boolean(errors.area)}
                placeholder="e.g. Nasr City"
                disabled={pending}
              />
              <datalist id="fl-area-options">
                {(governorate?.areas ?? []).map((area) => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </Field>
            <Field
              label="Street address"
              htmlFor="delivery_address"
              required
              error={errors.delivery_address}
              className="sm:col-span-2"
            >
              <Textarea
                id="delivery_address"
                autoComplete="street-address"
                value={values.delivery_address}
                onChange={(e) => setField("delivery_address")(e.target.value)}
                invalid={Boolean(errors.delivery_address)}
                placeholder="Building, street, floor, apartment…"
                disabled={pending}
              />
            </Field>
            <Field label="Delivery notes" htmlFor="delivery_notes" className="sm:col-span-2" hint="Call first, leave at the gate, preferred time…">
              <Textarea
                id="delivery_notes"
                value={values.delivery_notes}
                onChange={(e) => setField("delivery_notes")(e.target.value)}
                placeholder="Anything the driver should know"
                disabled={pending}
              />
            </Field>
            {lines.some((line) => line.isCustomizable) ? (
              <Field label="Gift message (hand-written card)" htmlFor="gift_message" className="sm:col-span-2">
                <Textarea
                  id="gift_message"
                  value={values.gift_message}
                  onChange={(e) => setField("gift_message")(e.target.value)}
                  placeholder="A short note we'll write on a card for your loved one"
                  disabled={pending}
                  maxLength={500}
                />
              </Field>
            ) : null}
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-6 shadow-hairline">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-extrabold text-white">3</span>
            Payment
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RadioCard
              name="payment_method"
              value="cash_on_delivery"
              checked={values.payment_method === "cash_on_delivery"}
              onChange={setField("payment_method")}
              icon={<Truck className="size-5" aria-hidden />}
              title="Cash on delivery"
              subtitle="Pay the delivery team when your gift arrives."
            />
            <RadioCard
              name="payment_method"
              value="card"
              checked={values.payment_method === "card"}
              onChange={setField("payment_method")}
              icon={<CreditCard className="size-5" aria-hidden />}
              title="Pay by card"
              subtitle="We'll send you a secure payment link right after."
            />
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockKeyhole className="size-3.5" aria-hidden />
            Your payment details stay safe. No card data touches our servers.
          </p>
        </section>
      </div>

      <aside className="rounded-card border border-border bg-surface p-6 shadow-hairline lg:sticky lg:top-6">
        <h2 className="text-base font-extrabold text-foreground">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-muted-foreground">
                {line.name} <span className="text-foreground">× {line.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatEGP(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatEGP(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-semibold tabular-nums">
              {freeShipping ? (
                <span className="text-success">FREE</span>
              ) : values.governorate ? (
                formatEGP(delivery)
              ) : (
                <span className="text-muted-foreground">select governorate</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <dt className="font-bold text-foreground">Total</dt>
            <dd className="text-lg font-extrabold tabular-nums text-foreground">
              {formatEGP(total)}
            </dd>
          </div>
        </dl>
        {!freeShipping && (
          <p className="mt-3 text-xs text-muted-foreground">
            Spend {formatEGP(Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal))} more to unlock free delivery.
          </p>
        )}

        {serverError ? (
          <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
            {serverError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
          {pending ? "Placing your order…" : "Place order"}
          {!pending && <ArrowRight className="size-4" aria-hidden />}
        </Button>
        <Link
          href="/cart"
          className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to cart
        </Link>
      </aside>
    </form>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  subtitle,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      className={`relative flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors ${
        checked ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="peer sr-only"
      />
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full transition-colors ${
          checked ? "bg-primary text-white" : "bg-surface-muted text-muted-foreground"
        }`}
      >
        {checked ? <Check className="size-4" aria-hidden /> : icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </label>
  );
}