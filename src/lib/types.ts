import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];
type Enums = Database["public"]["Enums"];

/* -------------------------------------------------------------------------- */
/* database rows                                                               */
/* -------------------------------------------------------------------------- */

export type Profile = Tables["profiles"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Product = Tables["products"]["Row"];
export type ProductImage = Tables["product_images"]["Row"];
export type ProductTag = Tables["product_tags"]["Row"];
export type ProductOption = Tables["product_options"]["Row"];
export type ProductOptionValue = Tables["product_option_values"]["Row"];
export type Customer = Tables["customers"]["Row"];
export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];
export type OrderStatusHistory = Tables["order_status_history"]["Row"];
export type InventoryMovement = Tables["inventory_movements"]["Row"];
export type InventoryStatusRow = Views["inventory_status"]["Row"];
export type CategoryStatsRow = Views["category_stats"]["Row"];
export type TagStatsRow = Views["tag_stats"]["Row"];

export type UserRole = Enums["user_role"];
export type OrderSource = Enums["order_source"];
export type OrderStatus = Enums["order_status"];
export type PaymentStatus = Enums["payment_status"];
export type MovementType = Enums["movement_type"];
export type TagKind = "recipient" | "occasion" | "vibe" | "general";
export type OptionType = "text" | "select" | "color" | "personalization";

/* -------------------------------------------------------------------------- */
/* composed view models                                                        */
/* -------------------------------------------------------------------------- */

/** Shape used by product cards, grids and search results. */
export interface ProductSummary extends Product {
  images: ProductImage[];
  categories: Pick<Category, "id" | "name" | "slug">[];
  tags: Pick<ProductTag, "id" | "name" | "slug" | "kind">[];
}

/** Shape used on the product detail page. */
export interface ProductDetail extends ProductSummary {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  related: ProductSummary[];
}

export interface CategoryWithCount extends Category {
  product_count: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Pick<Product, "id" | "name" | "slug" | "stock_quantity" | "is_active"> | null;
}

export interface OrderWithCustomer extends Order {
  customer: Customer | null;
  item_count: number;
}

export interface OrderDetail extends Order {
  customer: Customer | null;
  items: OrderItemWithProduct[];
  status_history: OrderStatusHistory[];
  created_by_profile: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface CustomerWithStats extends Customer {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export interface InventoryItem extends InventoryStatusRow {
  movement_count: number;
  last_movement_at: string | null;
}

export interface CartLine {
  /** Stable identity: product + personalization values. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  maxStock: number;
  imageUrl: string | null;
  isCustomizable: boolean;
  personalization: Record<string, string>;
}

export interface CreatedOrder {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
}
