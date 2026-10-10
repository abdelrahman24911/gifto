import type { CartLine, ProductSummary } from "@/lib/types";

const CART_KEY = "fltase3.cart.v1";
const WISHLIST_KEY = "fltase3.wishlist.v1";

export interface AddItemInput {
  product: Pick<
    ProductSummary,
    "id" | "slug" | "name" | "price" | "compare_at_price" | "stock_quantity" | "is_customizable"
  >;
  imageUrl?: string | null;
  personalization?: Record<string, string>;
}

export interface ShopSnapshot {
  lines: CartLine[];
  wishlist: string[];
}

const EMPTY: ShopSnapshot = { lines: [], wishlist: [] };

let snapshot: ShopSnapshot = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

export function lineKey(productId: string, personalization: Record<string, string> = {}) {
  const extras = Object.entries(personalization)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return extras ? `${productId}::${extras}` : productId;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked — cart stays in memory for this session
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  snapshot = {
    lines: readJson<CartLine[]>(CART_KEY, []),
    wishlist: readJson<string[]>(WISHLIST_KEY, []),
  };
}

function commit(next: ShopSnapshot, keys?: { cart?: boolean; wishlist?: boolean }) {
  snapshot = next;
  if (keys?.cart) writeJson(CART_KEY, next.lines);
  if (keys?.wishlist) writeJson(WISHLIST_KEY, next.wishlist);
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): ShopSnapshot {
  ensureLoaded();
  return snapshot;
}

export function getServerSnapshot(): ShopSnapshot {
  return EMPTY;
}

export function isHydrated(): boolean {
  return snapshot !== EMPTY;
}

export function addItem(input: AddItemInput, quantity = 1): void {
  const { product, imageUrl = null, personalization = {} } = input;
  const key = lineKey(product.id, personalization);
  const lines = snapshot.lines;
  const existing = lines.find((line) => line.key === key);
  const max = Math.max(1, product.stock_quantity);

  const next = existing
    ? lines.map((line) =>
        line.key === key ? { ...line, quantity: Math.min(max, line.quantity + quantity) } : line,
      )
    : [
        ...lines,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compare_at_price,
          quantity: Math.min(max, quantity),
          maxStock: max,
          imageUrl,
          isCustomizable: product.is_customizable,
          personalization,
        } satisfies CartLine,
      ];

  commit({ ...snapshot, lines: next }, { cart: true });
}

export function setQuantity(key: string, quantity: number): void {
  const lines = snapshot.lines
    .map((line) =>
      line.key === key ? { ...line, quantity: Math.max(0, Math.min(line.maxStock, quantity)) } : line,
    )
    .filter((line) => line.quantity > 0);
  commit({ ...snapshot, lines }, { cart: true });
}

export function removeLine(key: string): void {
  commit({ ...snapshot, lines: snapshot.lines.filter((line) => line.key !== key) }, { cart: true });
}

export function clearCart(): void {
  commit({ ...snapshot, lines: [] }, { cart: true });
}

export function toggleWishlist(productId: string): void {
  const wishlist = snapshot.wishlist.includes(productId)
    ? snapshot.wishlist.filter((id) => id !== productId)
    : [...snapshot.wishlist, productId];
  commit({ ...snapshot, wishlist }, { wishlist: true });
}
