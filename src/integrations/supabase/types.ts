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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      downtime_types: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loss_types: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          code: string
          created_at: string
          id: string
          location: string | null
          model: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_losses: {
        Row: {
          amount: number
          created_at: string
          id: string
          loss_type_id: string
          machine_id: string | null
          operator_id: string | null
          order_id: string | null
          reason: string
          recorded_at: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loss_type_id: string
          machine_id?: string | null
          operator_id?: string | null
          order_id?: string | null
          reason: string
          recorded_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loss_type_id?: string
          machine_id?: string | null
          operator_id?: string | null
          order_id?: string | null
          reason?: string
          recorded_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_losses_loss_type_id_fkey"
            columns: ["loss_type_id"]
            isOneToOne: false
            referencedRelation: "loss_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_losses_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_losses_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_losses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_history: {
        Row: {
          archived_at: string
          archived_reason: string | null
          created_at: string
          cycle_time_minutes: number | null
          downtime_description: string | null
          downtime_end_time: string | null
          downtime_minutes: number
          downtime_start_time: string | null
          downtime_type_id: string | null
          efficiency_percentage: number | null
          id: string
          machine_id: string | null
          operator_id: string | null
          order_id: string
          previous_record_id: string | null
          produced_quantity: number
          production_rate_per_minute: number | null
          recorded_at: string
          reject_quantity: number
          time_elapsed_minutes: number | null
        }
        Insert: {
          archived_at?: string
          archived_reason?: string | null
          created_at?: string
          cycle_time_minutes?: number | null
          downtime_description?: string | null
          downtime_end_time?: string | null
          downtime_minutes?: number
          downtime_start_time?: string | null
          downtime_type_id?: string | null
          efficiency_percentage?: number | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          order_id: string
          previous_record_id?: string | null
          produced_quantity?: number
          production_rate_per_minute?: number | null
          recorded_at?: string
          reject_quantity?: number
          time_elapsed_minutes?: number | null
        }
        Update: {
          archived_at?: string
          archived_reason?: string | null
          created_at?: string
          cycle_time_minutes?: number | null
          downtime_description?: string | null
          downtime_end_time?: string | null
          downtime_minutes?: number
          downtime_start_time?: string | null
          downtime_type_id?: string | null
          efficiency_percentage?: number | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          order_id?: string
          previous_record_id?: string | null
          produced_quantity?: number
          production_rate_per_minute?: number | null
          recorded_at?: string
          reject_quantity?: number
          time_elapsed_minutes?: number | null
        }
        Relationships: []
      }
      production_orders: {
        Row: {
          code: string
          created_at: string
          id: string
          machine_id: string
          pallet_quantity: number | null
          planned_quantity: number
          product_name: string
          shift: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          machine_id: string
          pallet_quantity?: number | null
          planned_quantity: number
          product_name: string
          shift: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          machine_id?: string
          pallet_quantity?: number | null
          planned_quantity?: number
          product_name?: string
          shift?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      production_records: {
        Row: {
          created_at: string
          cycle_time_minutes: number | null
          downtime_description: string | null
          downtime_end_time: string | null
          downtime_minutes: number
          downtime_start_time: string | null
          downtime_type_id: string | null
          efficiency_percentage: number | null
          id: string
          machine_id: string | null
          operator_id: string | null
          order_id: string
          previous_record_id: string | null
          produced_quantity: number
          production_rate_per_minute: number | null
          recorded_at: string
          reject_quantity: number
          time_elapsed_minutes: number | null
        }
        Insert: {
          created_at?: string
          cycle_time_minutes?: number | null
          downtime_description?: string | null
          downtime_end_time?: string | null
          downtime_minutes?: number
          downtime_start_time?: string | null
          downtime_type_id?: string | null
          efficiency_percentage?: number | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          order_id: string
          previous_record_id?: string | null
          produced_quantity?: number
          production_rate_per_minute?: number | null
          recorded_at?: string
          reject_quantity?: number
          time_elapsed_minutes?: number | null
        }
        Update: {
          created_at?: string
          cycle_time_minutes?: number | null
          downtime_description?: string | null
          downtime_end_time?: string | null
          downtime_minutes?: number
          downtime_start_time?: string | null
          downtime_type_id?: string | null
          efficiency_percentage?: number | null
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          order_id?: string
          previous_record_id?: string | null
          produced_quantity?: number
          production_rate_per_minute?: number | null
          recorded_at?: string
          reject_quantity?: number
          time_elapsed_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_records_downtime_type_id_fkey"
            columns: ["downtime_type_id"]
            isOneToOne: false
            referencedRelation: "downtime_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_previous_record_id_fkey"
            columns: ["previous_record_id"]
            isOneToOne: false
            referencedRelation: "production_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      recommendation_feedback: {
        Row: {
          created_at: string
          helpful: boolean
          id: string
          recommendation_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          helpful: boolean
          id?: string
          recommendation_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          helpful?: boolean
          id?: string
          recommendation_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          active: boolean
          category: string
          conditions: Json | null
          created_at: string
          description: string
          helpful_votes: number
          id: string
          machine_type: string | null
          not_helpful_votes: number
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          conditions?: Json | null
          created_at?: string
          description: string
          helpful_votes?: number
          id?: string
          machine_type?: string | null
          not_helpful_votes?: number
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          conditions?: Json | null
          created_at?: string
          description?: string
          helpful_votes?: number
          id?: string
          machine_type?: string | null
          not_helpful_votes?: number
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          file_path: string | null
          file_size: number | null
          format: string
          id: string
          name: string
          parameters: Json | null
          status: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          format?: string
          id?: string
          name: string
          parameters?: Json | null
          status?: string
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          file_path?: string | null
          file_size?: number | null
          format?: string
          id?: string
          name?: string
          parameters?: Json | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_machine_oee: {
        Args: { p_end_date: string; p_machine_id: string; p_start_date: string }
        Returns: {
          availability: number
          oee: number
          performance: number
          quality: number
        }[]
      }
      get_daily_trends: {
        Args: {
          p_end_date: string
          p_machine_id?: string
          p_start_date: string
        }
        Returns: {
          avg_efficiency: number
          quality_rate: number
          total_downtime: number
          total_produced: number
          total_rejects: number
          trend_date: string
        }[]
      }
      get_downtime_analysis: {
        Args: {
          p_end_date: string
          p_machine_id?: string
          p_start_date: string
        }
        Returns: {
          avg_duration: number
          downtime_category: string
          downtime_type_name: string
          occurrence_count: number
          total_minutes: number
        }[]
      }
      get_losses_by_type: {
        Args: {
          p_end_date: string
          p_machine_id?: string
          p_start_date: string
        }
        Returns: {
          loss_count: number
          loss_type_name: string
          total_amount: number
          unit: string
        }[]
      }
      get_machine_statistics: {
        Args: { p_days?: number; p_machine_id: string }
        Returns: {
          avg_cycle_time: number
          avg_efficiency: number
          quality_rate: number
          total_downtime: number
          total_produced: number
          total_rejects: number
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
