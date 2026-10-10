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
