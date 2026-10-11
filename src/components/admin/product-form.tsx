"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
  Star,
  Upload,
  X,
} from "lucide-react";
import { TAG_KIND_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_BUCKET,
  storageUrl,
  validateProductImageFile,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
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

export interface ProductFormImage {
  id: string;
  storage_path: string;
  alt_text: string | null;
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
  images: ProductFormImage[];
}

const FLAGS: { name: keyof ProductFormInitial; label: string }[] = [
  { name: "is_active", label: "Active (visible in store)" },
  { name: "is_featured", label: "Featured" },
  { name: "is_best_seller", label: "Best seller" },
  { name: "is_customizable", label: "Customizable" },
];

/**
 * A gallery item held in the form. Existing images come from the database;
 * new ones are local files waiting to be uploaded on submit. Both live in a
 * single ordered list so the admin can reorder/mark a cover across the whole
 * gallery.
 */
type DraftImage =
  | {
      key: string;
      kind: "existing";
      id: string;
      path: string;
      alt: string | null;
      preview: string;
    }
  | { key: string; kind: "new"; file: File; preview: string };

let draftSeq = 0;

function newDraftKey(): string {
  draftSeq += 1;
  return `draft-${Date.now()}-${draftSeq}`;
}

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

  const initialImages = React.useMemo<DraftImage[]>(
    () =>
      (initial?.images ?? []).map((image) => ({
        key: `db-${image.id}`,
        kind: "existing" as const,
        id: image.id,
        path: image.storage_path,
        alt: image.alt_text,
        preview: storageUrl(PRODUCT_IMAGE_BUCKET, image.storage_path) ?? "",
      })),
    [initial],
  );

  const [images, setImages] = React.useState<DraftImage[]>(initialImages);
  const [coverKey, setCoverKey] = React.useState<string | null>(initialImages[0]?.key ?? null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const objectUrls = React.useRef<Set<string>>(new Set());

  // Keep the native file input in sync with our ordered list, so a normal form
  // submit carries exactly the retained files in the right order.
  React.useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    for (const image of images) {
      if (image.kind === "new") transfer.items.add(image.file);
    }
    input.files = transfer.files;
  }, [images]);

  // Release any blob preview URLs when the form unmounts.
  React.useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  React.useEffect(() => {
    if (state?.error) toast.error("Couldn't save product", state.error);
  }, [state]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    const accepted: DraftImage[] = [];
    const rejected: string[] = [];
    for (const file of picked) {
      const reason = validateProductImageFile(file);
      if (reason) {
        rejected.push(`${file.name}: ${reason}`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      objectUrls.current.add(preview);
      accepted.push({ key: newDraftKey(), kind: "new", file, preview });
    }

    if (accepted.length > 0) {
      setImages((current) => [...current, ...accepted]);
      setCoverKey((current) => current ?? accepted[0].key);
    }
    if (rejected.length > 0) {
      toast.error("Some images were skipped", rejected.slice(0, 4).join("\n"));
    }
  };

  const removeImage = (key: string) => {
    const target = images.find((image) => image.key === key);
    if (target?.kind === "new") {
      URL.revokeObjectURL(target.preview);
      objectUrls.current.delete(target.preview);
    }
    const next = images.filter((image) => image.key !== key);
    setImages(next);
    if (coverKey === key) setCoverKey(next[0]?.key ?? null);
  };

  const moveImage = (key: string, direction: -1 | 1) => {
    setImages((current) => {
      const index = current.findIndex((image) => image.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = current.slice();
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const tagsByKind = tags.reduce<Record<string, FacetTag[]>>((acc, tag) => {
    (acc[tag.kind] ??= []).push(tag);
    return acc;
  }, {});

  const coverIndex = images.findIndex((image) => image.key === coverKey);
  const planJson = JSON.stringify(
    images.map((image) =>
      image.kind === "existing" ? { kind: "existing", id: image.id } : { kind: "new" },
    ),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={initial?.id ?? state?.productId ?? ""} />
      <input type="hidden" name="imagePlan" value={planJson} />
      <input type="hidden" name="coverIndex" value={String(coverIndex)} />

      <section className="rounded-card border border-border bg-surface p-5 shadow-hairline sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">Product images</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG or WebP · up to 5 MB each. The cover image is shown first everywhere.
            </p>
          </div>
          {images.length > 0 ? (
            <label
              htmlFor="images-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Upload className="size-4" aria-hidden />
              Add images
            </label>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          id="images-input"
          type="file"
          name="images"
          multiple
          accept={PRODUCT_IMAGE_ACCEPT}
          onChange={handleFiles}
          className="sr-only"
        />

        {images.length === 0 ? (
          <label
            htmlFor="images-input"
            className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-border-strong bg-surface-muted px-4 py-10 text-center transition-colors hover:border-primary/50"
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden />
            <span className="text-sm font-bold text-foreground">Add product images</span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG or WebP · up to 5 MB each · the first image becomes the cover
            </span>
          </label>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, index) => {
              const isCover = image.key === coverKey;
              return (
                <li
                  key={image.key}
                  className={cn(
                    "relative overflow-hidden rounded-card border bg-surface",
                    isCover ? "border-primary ring-2 ring-primary/30" : "border-border",
                  )}
                >
                  <div className="relative aspect-square bg-surface-muted">
                    {image.preview ? (
                      <Image
                        src={image.preview}
                        alt=""
                        fill
                        unoptimized
                        sizes="180px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">
                        <ImageIcon className="size-6" aria-hidden />
                      </div>
                    )}

                    <div className="pointer-events-none absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                      {isCover ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          <Star className="size-3 fill-current" aria-hidden /> Cover
                        </span>
                      ) : null}
                      <span className="rounded-pill bg-foreground/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {image.kind === "new" ? "New" : "Saved"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(image.key)}
                      disabled={pending}
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-pill bg-foreground/80 text-white transition-colors hover:bg-destructive disabled:opacity-50"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 p-1.5">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-foreground">
                      <input
                        type="radio"
                        name="__coverChoice"
                        checked={isCover}
                        onChange={() => setCoverKey(image.key)}
                        disabled={pending}
                        className="size-3.5 accent-primary"
                      />
                      Cover
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(image.key, -1)}
                        disabled={pending || index === 0}
                        aria-label={`Move image ${index + 1} earlier`}
                        className="grid size-6 place-items-center rounded-pill text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(image.key, 1)}
                        disabled={pending || index === images.length - 1}
                        aria-label={`Move image ${index + 1} later`}
                        className="grid size-6 place-items-center rounded-pill text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <ChevronRight className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {pending ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 rounded-card border border-border bg-surface-muted px-4 py-3"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Uploading and saving{images.some((image) => image.kind === "new") ? " images" : ""}…
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-primary/15">
              <div className="h-full w-2/3 animate-pulse rounded-pill bg-primary" />
            </div>
          </div>
        ) : null}
      </section>

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
                      className="size-4 rounded border-border accent-primary"
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
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {initial ? "Save product" : "Create product"}
        </Button>
        <Link
          href="/admin/products"
          className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
