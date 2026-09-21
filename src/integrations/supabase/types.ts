export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          opening_balance: number
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          main_category: Database["public"]["Enums"]["expense_main_category"]
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          main_category: Database["public"]["Enums"]["expense_main_category"]
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          main_category?: Database["public"]["Enums"]["expense_main_category"]
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          attachment_path: string | null
          beneficiary_name: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          invoice_no: string | null
          main_category: Database["public"]["Enums"]["expense_main_category"]
          notes: string | null
          paid_amount: number
          party_type: Database["public"]["Enums"]["party_type"]
          payment_method: string | null
          project_id: string | null
          project_item_id: string | null
          supplier_id: string | null
          total_amount: number
          updated_at: string
          updated_by: string | null
          worker_id: string | null
        }
        Insert: {
          account_id?: string | null
          attachment_path?: string | null
          beneficiary_name?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          invoice_no?: string | null
          main_category: Database["public"]["Enums"]["expense_main_category"]
          notes?: string | null
          paid_amount?: number
          party_type?: Database["public"]["Enums"]["party_type"]
          payment_method?: string | null
          project_id?: string | null
          project_item_id?: string | null
          supplier_id?: string | null
          total_amount: number
          updated_at?: string
          updated_by?: string | null
          worker_id?: string | null
        }
        Update: {
          account_id?: string | null
          attachment_path?: string | null
          beneficiary_name?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          invoice_no?: string | null
          main_category?: Database["public"]["Enums"]["expense_main_category"]
          notes?: string | null
          paid_amount?: number
          party_type?: Database["public"]["Enums"]["party_type"]
          payment_method?: string | null
          project_id?: string | null
          project_item_id?: string | null
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_item_id_fkey"
            columns: ["project_item_id"]
            isOneToOne: false
            referencedRelation: "project_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      project_items: {
        Row: {
          created_at: string
          created_by: string | null
          estimated_cost: number
          id: string
          name: string
          notes: string | null
          project_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estimated_cost?: number
          id?: string
          name: string
          notes?: string | null
          project_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estimated_cost?: number
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number
          client_name: string | null
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          budget?: number
          client_name?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          budget?: number
          client_name?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          account_id: string | null
          amount: number
          attachment_path: string | null
          created_at: string
          created_by: string | null
          id: string
          method: string | null
          notes: string | null
          payer: string | null
          payment_no: string | null
          project_id: string | null
          receipt_date: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payer?: string | null
          payment_no?: string | null
          project_id?: string | null
          receipt_date?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payer?: string | null
          payment_no?: string | null
          project_id?: string | null
          receipt_date?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          account_id: string | null
          amount: number
          attachment_path: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          project_id: string | null
          settlement_date: string
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
          uses_advance: boolean
          worker_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          party_type: Database["public"]["Enums"]["party_type"]
          project_id?: string | null
          settlement_date?: string
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          uses_advance?: boolean
          worker_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          party_type?: Database["public"]["Enums"]["party_type"]
          project_id?: string | null
          settlement_date?: string
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          uses_advance?: boolean
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      worker_advances: {
        Row: {
          account_id: string | null
          advance_date: string
          amount: number
          attachment_path: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          project_id: string | null
          settled_amount: number
          updated_at: string
          updated_by: string | null
          worker_id: string
        }
        Insert: {
          account_id?: string | null
          advance_date?: string
          amount: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          settled_amount?: number
          updated_at?: string
          updated_by?: string | null
          worker_id: string
        }
        Update: {
          account_id?: string | null
          advance_date?: string
          amount?: number
          attachment_path?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          settled_amount?: number
          updated_at?: string
          updated_by?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_advances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_advances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_advances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          agreed_wage: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          profession: string | null
          updated_at: string
          updated_by: string | null
          wage_type: string | null
        }
        Insert: {
          agreed_wage?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          updated_by?: string | null
          wage_type?: string | null
        }
        Update: {
          agreed_wage?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          updated_by?: string | null
          wage_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "cash" | "bank"
      expense_main_category: "materials" | "wages" | "services" | "operations"
      party_type: "worker" | "supplier" | "other"
      project_status: "in_progress" | "on_hold" | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["cash", "bank"],
      expense_main_category: ["materials", "wages", "services", "operations"],
      party_type: ["worker", "supplier", "other"],
      project_status: ["in_progress", "on_hold", "completed"],
    },
  },
} as const
