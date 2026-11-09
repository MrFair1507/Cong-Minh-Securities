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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cash_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: number
          margin_loan_id: number | null
          order_id: number | null
          type: Database["public"]["Enums"]["cash_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: number
          margin_loan_id?: number | null
          order_id?: number | null
          type: Database["public"]["Enums"]["cash_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: number
          margin_loan_id?: number | null
          order_id?: number | null
          type?: Database["public"]["Enums"]["cash_tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_margin_loan_id_fkey"
            columns: ["margin_loan_id"]
            isOneToOne: false
            referencedRelation: "margin_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exchanges: {
        Row: {
          code: string
          id: number
          name: string
          price_band: number
        }
        Insert: {
          code: string
          id?: number
          name: string
          price_band: number
        }
        Update: {
          code?: string
          id?: number
          name?: string
          price_band?: number
        }
        Relationships: []
      }
      holdings: {
        Row: {
          avg_cost: number
          id: number
          quantity: number
          stock_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost: number
          id?: number
          quantity: number
          stock_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          id?: number
          quantity?: number
          stock_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_accounts: {
        Row: {
          call_rate: number
          created_at: string
          id: number
          initial_rate: number
          maintenance_rate: number
          user_id: string
        }
        Insert: {
          call_rate?: number
          created_at?: string
          id?: number
          initial_rate?: number
          maintenance_rate?: number
          user_id: string
        }
        Update: {
          call_rate?: number
          created_at?: string
          id?: number
          initial_rate?: number
          maintenance_rate?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_calls: {
        Row: {
          created_at: string
          id: number
          margin_account_id: number
          ratio_at_call: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["margin_call_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          margin_account_id: number
          ratio_at_call: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["margin_call_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          margin_account_id?: number
          ratio_at_call?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["margin_call_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_calls_margin_account_id_fkey"
            columns: ["margin_account_id"]
            isOneToOne: false
            referencedRelation: "margin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_loans: {
        Row: {
          created_at: string
          id: number
          margin_account_id: number
          order_id: number
          outstanding: number
          principal: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          margin_account_id: number
          order_id: number
          outstanding: number
          principal: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          margin_account_id?: number
          order_id?: number
          outstanding?: number
          principal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_loans_margin_account_id_fkey"
            columns: ["margin_account_id"]
            isOneToOne: false
            referencedRelation: "margin_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_loans_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: number
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          stock_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          price: number
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          stock_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          price?: number
          quantity?: number
          side?: Database["public"]["Enums"]["order_side"]
          stock_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          close: number
          high: number
          id: number
          low: number
          open: number
          stock_id: number
          trade_date: string
          volume: number
        }
        Insert: {
          close: number
          high: number
          id?: number
          low: number
          open: number
          stock_id: number
          trade_date: string
          volume?: number
        }
        Update: {
          close?: number
          high?: number
          id?: number
          low?: number
          open?: number
          stock_id?: number
          trade_date?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_history_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cash_balance: number
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          cash_balance?: number
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          cash_balance?: number
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          ceiling_price: number
          exchange_id: number
          floor_price: number
          id: number
          loan_rate: number
          name: string
          price: number
          ref_price: number
          symbol: string
          updated_at: string
          volume: number
        }
        Insert: {
          ceiling_price: number
          exchange_id: number
          floor_price: number
          id?: number
          loan_rate?: number
          name: string
          price: number
          ref_price: number
          symbol: string
          updated_at?: string
          volume?: number
        }
        Update: {
          ceiling_price?: number
          exchange_id?: number
          floor_price?: number
          id?: number
          loan_rate?: number
          name?: string
          price?: number
          ref_price?: number
          symbol?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "stocks_exchange_id_fkey"
            columns: ["exchange_id"]
            isOneToOne: false
            referencedRelation: "exchanges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initial_cash: { Args: never; Returns: number }
    }
    Enums: {
      cash_tx_type: "INIT" | "BUY" | "SELL" | "LOAN" | "REPAY"
      margin_call_status: "OPEN" | "RESOLVED"
      order_side: "BUY" | "SELL"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      cash_tx_type: ["INIT", "BUY", "SELL", "LOAN", "REPAY"],
      margin_call_status: ["OPEN", "RESOLVED"],
      order_side: ["BUY", "SELL"],
    },
  },
} as const
