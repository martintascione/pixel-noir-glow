export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      category_margins: {
        Row: {
          category_name: string
          created_at: string
          id: string
          profit_margin: number
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          profit_margin?: number
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          profit_margin?: number
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_legal_name: string | null
          company_name: string
          created_at: string
          cuit: string
          id: string
          name: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          company_legal_name?: string | null
          company_name: string
          created_at?: string
          cuit: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          company_legal_name?: string | null
          company_name?: string
          created_at?: string
          cuit?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      general_config: {
        Row: {
          created_at: string
          id: string
          iva_rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          iva_rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          iva_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_combos: {
        Row: {
          created_at: string
          discount_percentage: number | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          price: number
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          product_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_combos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          created_at: string
          id: string
          product_id: string
          production_cost: number
          profit_margin: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          production_cost?: number
          profit_margin?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          production_cost?: number
          profit_margin?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          diameter: string | null
          display_order: number | null
          id: string
          nail_type: string | null
          name: string
          price: number
          shape: string | null
          size: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          diameter?: string | null
          display_order?: number | null
          id?: string
          nail_type?: string | null
          name: string
          price: number
          shape?: string | null
          size: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          diameter?: string | null
          display_order?: number | null
          id?: string
          nail_type?: string | null
          name?: string
          price?: number
          shape?: string | null
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepts_notifications: boolean
          company_cuit: string
          company_legal_name: string
          company_name: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          requires_invoice_a: boolean
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          accepts_notifications?: boolean
          company_cuit: string
          company_legal_name: string
          company_name: string
          created_at?: string
          first_name: string
          id?: string
          last_name: string
          requires_invoice_a?: boolean
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          accepts_notifications?: boolean
          company_cuit?: string
          company_legal_name?: string
          company_name?: string
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          requires_invoice_a?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      remito_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          medida: string
          precio_total: number
          precio_unitario: number
          producto: string
          remito_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          medida: string
          precio_total: number
          precio_unitario: number
          producto: string
          remito_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          medida?: string
          precio_total?: number
          precio_unitario?: number
          producto?: string
          remito_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remito_items_remito_id_fkey"
            columns: ["remito_id"]
            isOneToOne: false
            referencedRelation: "remitos"
            referencedColumns: ["id"]
          },
        ]
      }
      remitos: {
        Row: {
          client_id: string
          created_at: string
          fecha: string
          id: string
          numero: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          fecha: string
          id?: string
          numero: string
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          fecha?: string
          id?: string
          numero?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remitos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sec_configuracion_venta: {
        Row: {
          created_at: string
          id: string
          iva: number
          margen_ganancia: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          iva?: number
          margen_ganancia?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          iva?: number
          margen_ganancia?: number
          updated_at?: string
        }
        Relationships: []
      }
      sec_estribo_pesos: {
        Row: {
          created_at: string
          estribo_id: string
          id: string
          peso: number
          proveedor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estribo_id: string
          id?: string
          peso: number
          proveedor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estribo_id?: string
          id?: string
          peso?: number
          proveedor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sec_estribo_pesos_estribo_id_fkey"
            columns: ["estribo_id"]
            isOneToOne: false
            referencedRelation: "sec_estribos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sec_estribo_pesos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "sec_proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      sec_estribos: {
        Row: {
          created_at: string
          id: string
          medida: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medida: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medida?: string
          updated_at?: string
        }
        Relationships: []
      }
      sec_precios_por_unidad: {
        Row: {
          created_at: string
          estribo_id: string
          id: string
          precio_unitario: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estribo_id: string
          id?: string
          precio_unitario?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estribo_id?: string
          id?: string
          precio_unitario?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sec_precios_por_unidad_estribo_id_fkey"
            columns: ["estribo_id"]
            isOneToOne: false
            referencedRelation: "sec_estribos"
            referencedColumns: ["id"]
          },
        ]
      }
      sec_proveedores: {
        Row: {
          created_at: string
          id: string
          nombre: string
          precio_por_kg: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          precio_por_kg: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          precio_por_kg?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_prices_by_category: {
        Args: { p_category_id: string; p_percentage: number }
        Returns: {
          id: string
          name: string
          old_price: number
          new_price: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
