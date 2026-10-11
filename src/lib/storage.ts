/** Supabase Storage buckets used across the app. */
export const BUCKETS = {
  products: "product-images",
  categories: "category-images",
  homepage: "homepage-images",
  brand: "brand-assets",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Public URL for an object in one of the public-read buckets.
 * Built by hand (rather than `getPublicUrl`) so it is identical on the server
 * and in the browser and needs no client instance.
 */
export function storageUrl(bucket: BucketName, path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(clean)}`;
}

/** Random-but-stable hue used to tint placeholders for a given name. */
export function placeholderHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

/* -------------------------------------------------------------------------- */
/* product images                                                              */
/* -------------------------------------------------------------------------- */

/** Bucket that holds product photos — matches the storage migration. */
export const PRODUCT_IMAGE_BUCKET = "product-images" as const;

/** Mirrors the bucket's `file_size_limit` (5 MB). */
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Formats the admin form accepts; must stay inside the bucket allow-list. */
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProductImageMimeType = (typeof PRODUCT_IMAGE_MIME_TYPES)[number];

/** Value for an `<input type="file" accept="…">`. */
export const PRODUCT_IMAGE_ACCEPT = PRODUCT_IMAGE_MIME_TYPES.join(",");

const PRODUCT_IMAGE_EXTENSION: Record<ProductImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedProductImageType(type: string): type is ProductImageMimeType {
  return (PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

/**
 * Returns a human-readable reason when a file is not a valid product image,
 * or `null` when it is acceptable. Used on both the client (fast feedback) and
 * the server (authoritative check) so the two never drift.
 */
export function validateProductImageFile(file: { type: string; size: number }): string | null {
  if (!isAllowedProductImageType(file.type)) {
    return "Use a JPG, PNG or WebP image.";
  }
  if (file.size <= 0) {
    return "That file is empty.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

function productImageExtension(type: string, fileName = ""): string {
  if (isAllowedProductImageType(type)) return PRODUCT_IMAGE_EXTENSION[type];
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  return match ? match[1].toLowerCase() : "bin";
}

/**
 * Builds a unique, collision-proof storage path under a product folder:
 * `<productId>/<uuid>.<ext>`. Every upload gets a fresh name so an admin can
 * never accidentally overwrite an existing file.
 */
export function buildProductImagePath(productId: string, type: string, fileName = ""): string {
  const extension = productImageExtension(type, fileName);
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 12);
  return `${productId}/${unique}.${extension}`;
}
