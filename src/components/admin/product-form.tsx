"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TAG_KIND_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import { saveProduct, type ProductFormState } from "@/app/admin/(protected)/products/actions";

interface FacetCategory {
  id: string;
  name: string;
  slug: string;
}

interface FacetTag {
  id: string;
  name: string;
  slug: string;
  kind: string;
}

export interface ProductFormInitial {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  short_description: string | null;
  description: string;
  low_stock_threshold: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_customizable: boolean;
  categoryIds: string[];
  tagIds: string[];
}

const FLAGS: { name: keyof ProductFormInitial; label: string }[] = [
  { name: "is_active", label: "Active (visible in store)" },
  { name: "is_featured", label: "Featured" },
  { name: "is_best_seller", label: "Best seller" },
  { name: "is_customizable", label: "Customizable" },
];

export function ProductForm({
  initial,
  categories,
  tags,
}: {
  initial?: ProductFormInitial | null;
  categories: FacetCategory[];
  tags: FacetTag[];
}) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    null,
  );

  const tagsByKind = tags.reduce<Record<string, FacetTag[]>>((acc, tag) => {
    (acc[tag.kind] ??= []).push(tag);
    return acc;
  }, {});

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
        <h2 className="mb-5 text-base font-bold tracking-tight">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" required className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={initial?.name ?? ""} required />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the name">
            <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
          </Field>
          <Field label="SKU" htmlFor="sku">
            <Input id="sku" name="sku" defaultValue={initial?.sku ?? ""} />
          </Field>
          <Field label="Price (EGP)" htmlFor="price" required>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={initial ? String(initial.price) : ""}
              required
            />
          </Field>
          <Field label="Compare-at price (EGP)" htmlFor="compare_at_price">
            <Input
              id="compare_at_price"
              name="compare_at_price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              defaultValue={initial?.compare_at_price != null ? String(initial.compare_at_price) : ""}
            />
          </Field>
          <Field label="Low-stock threshold" htmlFor="low_stock_threshold">
            <Input
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              min="0"
              step="1"
              defaultValue={String(initial?.low_stock_threshold ?? 5)}
            />
          </Field>
          {!initial ? (
            <Field label="Opening stock" htmlFor="stock_quantity">
              <Input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                min="0"
                step="1"
                defaultValue="0"
              />
            </Field>
          ) : (
            <Field
              label="Stock on hand"
              htmlFor="stock-readonly"
              hint="Change stock from the Inventory page to keep an audit trail."
            >
              <Input id="stock-readonly" value={initial.stock_quantity} readOnly disabled />
            </Field>
          )}
          <Field label="Short description" htmlFor="short_description" className="sm:col-span-2">
            <Input
              id="short_description"
              name="short_description"
              defaultValue={initial?.short_description ?? ""}
              placeholder="One line shown on product cards"
            />
          </Field>
          <Field label="Description" htmlFor="description" required className="sm:col-span-2">
            <Textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={initial?.description ?? ""}
              required
            />
          </Field>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-foreground">Flags</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAGS.map((flag) => (
              <label key={flag.name} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name={flag.name}
                  defaultChecked={
                    initial ? Boolean(initial[flag.name]) : flag.name === "is_active"
                  }
                  className="size-4 rounded border-border text-primary accent-primary"
                />
                {flag.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
        <h2 className="text-base font-bold tracking-tight">Categories</h2>
        <p className="mb-4 text-sm text-muted-foreground">Choose every collection this belongs to.</p>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={initial?.categoryIds.includes(category.id) ?? false}
                  className="size-4 rounded border-border accent-primary"
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
        <h2 className="text-base font-bold tracking-tight">Tags</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Used by the gift finder and shop filters.
        </p>
        <div className="space-y-5">
          {Object.entries(tagsByKind).map(([kind, kindTags]) => (
            <div key={kind}>
              <Label>{TAG_KIND_LABELS[kind as keyof typeof TAG_KIND_LABELS] ?? kind}</Label>
              <div className="flex flex-wrap gap-2">
                {kindTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1.5 text-xs font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      name="tagIds"
                      value={tag.id}
                      defaultChecked={initial?.tagIds.includes(tag.id) ?? false}
                      className="size-3.5 accent-primary"
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {state?.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {initial ? "Save changes" : "Create product"}
        </Button>
        <Link
          href="/admin/products"
          className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
