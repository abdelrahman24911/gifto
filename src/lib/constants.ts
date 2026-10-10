import type {
  MovementType,
  OrderSource,
  OrderStatus,
  PaymentStatus,
  TagKind,
} from "@/lib/types";

export const BRAND = {
  name: "FL Tase3",
  tagline: "The gift that says what you don't know how to say.",
  instagram: "https://instagram.com/fltase3",
  instagramHandle: "@fltase3",
  whatsapp: "https://wa.me/201000000000",
  whatsappDisplay: "+20 100 000 0000",
  email: "hello@fltase3.com",
  copyrightYear: 2026,
} as const;

/* -------------------------------------------------------------------------- */
/* delivery                                                                    */
/* -------------------------------------------------------------------------- */

export interface Governorate {
  slug: string;
  name: string;
  fee: number;
  areas: string[];
}

export const GOVERNORATES: Governorate[] = [
  { slug: "cairo", name: "Cairo", fee: 60, areas: ["Maadi", "Heliopolis", "Nasr City", "Zamalek", "Dokki", "New Cairo", "6th of October", "Shubra"] },
  { slug: "giza", name: "Giza", fee: 65, areas: ["Mohandessin", "Haram", "Sheikh Zayed", "Fifth Settlement", "Badr El Din"] },
  { slug: "alexandria", name: "Alexandria", fee: 70, areas: ["Smouha", "Sidi Bishr", "Montaza", "Mahmoudeya"] },
  { slug: "behera", name: "Behera", fee: 75, areas: ["Rousetta", "Damanhour", "Kafr El Dawwar"] },
  { slug: "gharbia", name: "Gharbia", fee: 75, areas: ["Tanta", "Mahalla", "Kafrel Sheikh"] },
  { slug: "qalyubia", name: "Qalyubia", fee: 70, areas: ["Banha", "Shubra El Kheima", "Qalyub"] },
  { slug: "sharqia", name: "Sharqia", fee: 80, areas: ["Zagazig", "10th of Ramadan", "Bilbeis"] },
  { slug: "mansoura", name: "Dakahlia", fee: 80, areas: ["Mansoura", "Talkha", "Agga"] },
  { slug: "ismailia", name: "Ismailia", fee: 85, areas: ["Ismailia", "Abu Suwayr"] },
  { slug: "fayoum", name: "Fayoum", fee: 85, areas: ["Fayoum", "Tamia"] },
  { slug: "minya", name: "Minya", fee: 95, areas: ["Minya", "Beni Suef North"] },
  { slug: "assiut", name: "Assiut", fee: 100, areas: ["Assiut", "Dairut"] },
  { slug: "sohag", name: "Sohag", fee: 105, areas: ["Sohag", "Akhmim"] },
  { slug: "qena", name: "Qena", fee: 110, areas: ["Qena", "Luxor Road"] },
  { slug: "luxor", name: "Luxor", fee: 115, areas: ["Luxor", "Karnak"] },
  { slug: "aswan", name: "Aswan", fee: 120, areas: ["Aswan", "Elephantine"] },
  { slug: "red-sea", name: "Red Sea", fee: 130, areas: ["Hurghada", "Safaga"] },
  { slug: "new-valley", name: "New Valley", fee: 140, areas: ["Kharga", "Dakhla"] },
  { slug: "matrouh", name: "Matrouh", fee: 130, areas: ["Marsa Matrouh", "El Alamein"] },
  { slug: "sinai", name: "North Sinai", fee: 140, areas: ["Arish", "Sharm El Sheikh"] },
  { slug: "suez", name: "Suez", fee: 90, areas: ["Suez", "Ain Sokhna"] },
  { slug: "port-said", name: "Port Said", fee: 90, areas: ["Port Said", "Port Fouad"] },
  { slug: "damietta", name: "Damietta", fee: 90, areas: ["Damietta", "Ras El Bar"] },
  { slug: "kafr-el-sheikh", name: "Kafr El Sheikh", fee: 85, areas: ["Kafr El Sheikh", "Sidi Salim"] },
];

export const FREE_DELIVERY_THRESHOLD = 1500;
export const DEFAULT_DELIVERY_FEE = 60;

/* -------------------------------------------------------------------------- */
/* orders                                                                      */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
];

export const ORDER_SOURCES: OrderSource[] = [
  "website",
  "instagram",
  "whatsapp",
  "store",
  "manual",
];

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  website: "Website",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  store: "Store",
  manual: "Manual",
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "cash_on_delivery",
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cash_on_delivery: "Cash on delivery",
};

export const MOVEMENT_TYPES: MovementType[] = [
  "sale",
  "restock",
  "adjustment",
  "cancellation",
  "return",
];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  sale: "Sale",
  restock: "Restock",
  adjustment: "Adjustment",
  cancellation: "Cancellation",
  return: "Return",
};

/* -------------------------------------------------------------------------- */
/* taxonomy                                                                    */
/* -------------------------------------------------------------------------- */

export const TAG_KINDS: TagKind[] = ["recipient", "occasion", "vibe", "general"];

export const TAG_KIND_LABELS: Record<TagKind, string> = {
  recipient: "Recipient",
  occasion: "Occasion",
  vibe: "Vibe",
  general: "Tag",
};

/* -------------------------------------------------------------------------- */
/* budgets                                                                     */
/* -------------------------------------------------------------------------- */

export interface BudgetTier {
  slug: string;
  label: string;
  min: number;
  max: number | null;
}

export const BUDGET_TIERS: BudgetTier[] = [
  { slug: "under-300", label: "Under 300 EGP", min: 0, max: 300 },
  { slug: "under-500", label: "Under 500 EGP", min: 0, max: 500 },
  { slug: "under-750", label: "Under 750 EGP", min: 0, max: 750 },
  { slug: "under-1000", label: "Under 1000 EGP", min: 0, max: 1000 },
  { slug: "over-1000", label: "1000+ EGP", min: 1000, max: null },
];

/* -------------------------------------------------------------------------- */
/* pagination                                                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;
