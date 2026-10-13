export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image_path: string | null;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          product_id: string;
          quantity: number;
          reference_id: string | null;
          reference_type: string | null;
          type: Database["public"]["Enums"]["movement_type"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          product_id: string;
          quantity: number;
          reference_id?: string | null;
          reference_type?: string | null;
          type: Database["public"]["Enums"]["movement_type"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          product_id?: string;
          quantity?: number;
          reference_id?: string | null;
          reference_type?: string | null;
          type?: Database["public"]["Enums"]["movement_type"];
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_outbox: {
        Row: {
          attempts: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          event_type: string;
          id: string;
          idempotency_key: string;
          last_error: string | null;
          locked_at: string | null;
          max_attempts: number;
          next_attempt_at: string;
          order_id: string;
          payload: Json;
          provider_message_id: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          event_type?: string;
          id?: string;
          idempotency_key: string;
          last_error?: string | null;
          locked_at?: string | null;
          max_attempts?: number;
          next_attempt_at?: string;
          order_id: string;
          payload: Json;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          event_type?: string;
          id?: string;
          idempotency_key?: string;
          last_error?: string | null;
          locked_at?: string | null;
          max_attempts?: number;
          next_attempt_at?: string;
          order_id?: string;
          payload?: Json;
          provider_message_id?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_outbox_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_total: number | null;
          order_id: string;
          personalization_data: NonNullable<Json>;
          product_id: string | null;
          product_name_snapshot: string;
          quantity: number;
          slug_snapshot: string | null;
          unit_price: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          line_total?: never;
          order_id: string;
          personalization_data?: NonNullable<Json>;
          product_id?: string | null;
          product_name_snapshot: string;
          quantity: number;
          slug_snapshot?: string | null;
          unit_price: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total?: never;
          order_id?: string;
          personalization_data?: NonNullable<Json>;
          product_id?: string | null;
          product_name_snapshot?: string;
          quantity?: number;
          slug_snapshot?: string | null;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: string;
          note: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        ComputedFields: never;
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          note?: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          note?: string | null;
          order_id?: string;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          area: string | null;
          created_at: string;
          created_by: string | null;
          customer_id: string;
          delivery_address: string;
          delivery_fee: number;
          gift_message: string | null;
          governorate: string;
          id: string;
          notes: string | null;
          order_number: string;
          payment_status: Database["public"]["Enums"]["payment_status"];
          source: Database["public"]["Enums"]["order_source"];
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          area?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          delivery_address: string;
          delivery_fee?: number;
          gift_message?: string | null;
          governorate: string;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          area?: string | null;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          delivery_address?: string;
          delivery_fee?: number;
          gift_message?: string | null;
          governorate?: string;
          id?: string;
          notes?: string | null;
          order_number?: string;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customer_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      product_categories: {
        Row: {
          category_id: string;
          product_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          product_id: string;
        };
        Update: {
          category_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "category_stats";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          is_primary: boolean;
          product_id: string;
          sort_order: number;
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          product_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          product_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_option_values: {
        Row: {
          id: string;
          option_id: string;
          sort_order: number;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          option_id: string;
          sort_order?: number;
          value: string;
        };
        Update: {
          id?: string;
          option_id?: string;
          sort_order?: number;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: {
          id: string;
          is_required: boolean;
          name: string;
          product_id: string;
          sort_order: number;
          type: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          is_required?: boolean;
          name: string;
          product_id: string;
          sort_order?: number;
          type?: string;
        };
        Update: {
          id?: string;
          is_required?: boolean;
          name?: string;
          product_id?: string;
          sort_order?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tag_relations: {
        Row: {
          product_id: string;
          tag_id: string;
        };
        ComputedFields: never;
        Insert: {
          product_id: string;
          tag_id: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_tag_relations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "inventory_status";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_tag_relations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_tag_relations_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "product_tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_tag_relations_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tag_stats";
            referencedColumns: ["id"];
          },
        ];
      };
      product_tags: {
        Row: {
          id: string;
          kind: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          kind?: string;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          kind?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          compare_at_price: number | null;
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          is_best_seller: boolean;
          is_customizable: boolean;
          is_featured: boolean;
          low_stock_threshold: number;
          name: string;
          price: number;
          rating: number;
          reviews_count: number;
          short_description: string | null;
          sku: string | null;
          slug: string;
          stock_quantity: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          compare_at_price?: number | null;
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          is_best_seller?: boolean;
          is_customizable?: boolean;
          is_featured?: boolean;
          low_stock_threshold?: number;
          name: string;
          price: number;
          rating?: number;
          reviews_count?: number;
          short_description?: string | null;
          sku?: string | null;
          slug: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          compare_at_price?: number | null;
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          is_best_seller?: boolean;
          is_customizable?: boolean;
          is_featured?: boolean;
          low_stock_threshold?: number;
          name?: string;
          price?: number;
          rating?: number;
          reviews_count?: number;
          short_description?: string | null;
          sku?: string | null;
          slug?: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      category_stats: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string | null;
          image_path: string | null;
          is_active: boolean | null;
          name: string | null;
          product_count: number | null;
          slug: string | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      customer_stats: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          last_order_at: string | null;
          order_count: number | null;
          phone: string | null;
          total_spent: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      inventory_status: {
        Row: {
          is_active: boolean | null;
          low_stock_threshold: number | null;
          name: string | null;
          on_hand_quantity: number | null;
          product_id: string | null;
          reserved_quantity: number | null;
          sku: string | null;
          slug: string | null;
          status: string | null;
          stock_quantity: number | null;
          updated_at: string | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      tag_stats: {
        Row: {
          id: string | null;
          kind: string | null;
          name: string | null;
          product_count: number | null;
          slug: string | null;
          sort_order: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      adjust_stock: {
        Args: { p_new_stock: number; p_product_id: string; p_reason: string };
        Returns: Json;
      };
      create_order: {
        Args: {
          p_area: string;
          p_delivery_address: string;
          p_delivery_notes?: string;
          p_email: string;
          p_full_name: string;
          p_gift_message?: string;
          p_governorate: string;
          p_items: Json;
          p_payment_method?: Database["public"]["Enums"]["payment_method"];
          p_phone: string;
          p_source?: Database["public"]["Enums"]["order_source"];
        };
        Returns: Json;
      };
      claim_notification_jobs: {
        Args: {
          p_channel?: Database["public"]["Enums"]["notification_channel"];
          p_limit?: number;
        };
        Returns: Json;
      };
      delivery_fee_for: {
        Args: { p_governorate: string; p_subtotal: number };
        Returns: number;
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_order_status: {
        Args: { p_order_number: string; p_phone: string };
        Returns: Json;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      mark_notification_failed: {
        Args: {
          p_error: string;
          p_id: string;
          p_next_attempt_at?: string;
          p_retry?: boolean;
        };
        Returns: undefined;
      };
      mark_notification_sent: {
        Args: { p_id: string; p_provider_message_id?: string };
        Returns: undefined;
      };
      restock: {
        Args: { p_note?: string; p_product_id: string; p_quantity: number };
        Returns: Json;
      };
      set_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"];
          p_note?: string;
          p_order_id: string;
        };
        Returns: Json;
      };
      set_payment_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["payment_status"];
          p_order_id: string;
        };
        Returns: Json;
      };
      slugify: { Args: { p_input: string }; Returns: string };
      upsert_my_customer: {
        Args: { p_email?: string; p_full_name: string; p_phone: string };
        Returns: string;
      };
    };
    Enums: {
      movement_type:
        "sale" | "restock" | "adjustment" | "cancellation" | "return";
      notification_channel: "email" | "whatsapp";
      notification_status: "pending" | "sending" | "sent" | "failed";
      order_source: "website" | "instagram" | "whatsapp" | "store" | "manual";
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_method: "cash_on_delivery" | "card";
      payment_status: "pending" | "paid" | "failed" | "cash_on_delivery";
      user_role: "customer" | "admin" | "staff";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      movement_type: [
        "sale",
        "restock",
        "adjustment",
        "cancellation",
        "return",
      ],
      notification_channel: ["email", "whatsapp"],
      notification_status: ["pending", "sending", "sent", "failed"],
      order_source: ["website", "instagram", "whatsapp", "store", "manual"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "failed", "cash_on_delivery"],
      user_role: ["customer", "admin", "staff"],
    },
  },
} as const;
