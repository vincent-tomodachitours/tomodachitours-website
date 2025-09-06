export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      bookings: {
        Row: {
          adults: number
          booking_date: string
          booking_time: string
          charge_id: string | null
          children: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          discount_code: string | null
          discount_code_id: number | null
          id: number
          paid_amount: number | null
          infants: number
          status: string
          total_participants: number | null
          tour_type: string
        }
        Insert: {
          adults: number
          booking_date: string
          booking_time: string
          charge_id?: string | null
          children?: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_code_id?: number | null
          id?: number
          paid_amount?: number | null
          infants?: number
          status?: string
          total_participants?: number | null
          tour_type: string
        }
        Update: {
          adults?: number
          booking_date?: string
          booking_time?: string
          charge_id?: string | null
          children?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_code_id?: number | null
          id?: number
          paid_amount?: number | null
          infants?: number
          status?: string
          total_participants?: number | null
          tour_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: number
          max_uses: number | null
          type: string
          updated_at: string
          used_count: number
          valid_from: string
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: number
          max_uses?: number | null
          type: string
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          max_uses?: number | null
          type?: string
          updated_at?: string
          used_count?: number
          valid_from?: string
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      tours: {
        Row: {
          base_price: number
          cancellation_cutoff_hours: number | null
          cancellation_cutoff_hours_with_participant: number | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          max_participants: number
          name: string
          next_day_cutoff_time: string | null
          original_price: number | null
          reviews: number | null
          time_slots: Json
          type: Database["public"]["Enums"]["tour_type"]
          updated_at: string
        }
        Insert: {
          base_price: number
          cancellation_cutoff_hours?: number | null
          cancellation_cutoff_hours_with_participant?: number | null
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: string
          max_participants: number
          name: string
          next_day_cutoff_time?: string | null
          original_price?: number | null
          reviews?: number | null
          time_slots?: Json
          type: Database["public"]["Enums"]["tour_type"]
          updated_at?: string
        }
        Update: {
          base_price?: number
          cancellation_cutoff_hours?: number | null
          cancellation_cutoff_hours_with_participant?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          max_participants?: number
          name?: string
          next_day_cutoff_time?: string | null
          original_price?: number | null
          reviews?: number | null
          time_slots?: Json
          type?: Database["public"]["Enums"]["tour_type"]
          updated_at?: string
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
      booking_status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED"
      discount_type: "PERCENTAGE" | "FIXED"
      tour_type: "NIGHT_TOUR" | "MORNING_TOUR" | "UJI_TOUR" | "UJI_WALKING_TOUR" | "GION_TOUR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"],
      discount_type: ["PERCENTAGE", "FIXED"],
      tour_type: ["NIGHT_TOUR", "MORNING_TOUR", "UJI_TOUR", "UJI_WALKING_TOUR", "GION_TOUR"],
    },
  },
} as const
