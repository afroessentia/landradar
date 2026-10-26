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
  public: {
    Tables: {
      counties_states: {
        Row: {
          apify_task_id: string | null
          county_name: string
          gis_url_template: string | null
          id: string
          is_active: boolean
          portal_buy_url: string | null
          state: Database["public"]["Enums"]["us_state"]
        }
        Insert: {
          apify_task_id?: string | null
          county_name: string
          gis_url_template?: string | null
          id?: string
          is_active?: boolean
          portal_buy_url?: string | null
          state: Database["public"]["Enums"]["us_state"]
        }
        Update: {
          apify_task_id?: string | null
          county_name?: string
          gis_url_template?: string | null
          id?: string
          is_active?: boolean
          portal_buy_url?: string | null
          state?: Database["public"]["Enums"]["us_state"]
        }
        Relationships: []
      }
      otc_properties: {
        Row: {
          acreage: number | null
          county_state_id: string
          created_at: string
          direct_buy_url: string | null
          due_diligence_checklist: Json
          favorite: boolean
          id: string
          latitude: number | null
          legal_description: string | null
          longitude: number | null
          marketing_copy_generated: string | null
          notes: string | null
          otc_price: number | null
          parcel_id: string
          raw_payload: Json | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["property_status"]
          subdivision: string | null
          target_sale_price: number | null
          updated_at: string
        }
        Insert: {
          acreage?: number | null
          county_state_id: string
          created_at?: string
          direct_buy_url?: string | null
          due_diligence_checklist?: Json
          favorite?: boolean
          id?: string
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          marketing_copy_generated?: string | null
          notes?: string | null
          otc_price?: number | null
          parcel_id: string
          raw_payload?: Json | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          subdivision?: string | null
          target_sale_price?: number | null
          updated_at?: string
        }
        Update: {
          acreage?: number | null
          county_state_id?: string
          created_at?: string
          direct_buy_url?: string | null
          due_diligence_checklist?: Json
          favorite?: boolean
          id?: string
          latitude?: number | null
          legal_description?: string | null
          longitude?: number | null
          marketing_copy_generated?: string | null
          notes?: string | null
          otc_price?: number | null
          parcel_id?: string
          raw_payload?: Json | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          subdivision?: string | null
          target_sale_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "otc_properties_county_state_id_fkey"
            columns: ["county_state_id"]
            isOneToOne: false
            referencedRelation: "counties_states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_properties: {
        Row: {
          acreage: number | null
          county_name: string | null
          county_state_id: string | null
          created_at: string | null
          direct_buy_url: string | null
          due_diligence_checklist: Json | null
          est_margin: number | null
          favorite: boolean | null
          gis_url: string | null
          id: string | null
          latitude: number | null
          legal_description: string | null
          longitude: number | null
          marketing_copy_generated: string | null
          notes: string | null
          otc_price: number | null
          parcel_id: string | null
          portal_buy_url: string | null
          raw_payload: Json | null
          rejection_reason: string | null
          satellite_url: string | null
          state: Database["public"]["Enums"]["us_state"] | null
          status: Database["public"]["Enums"]["property_status"] | null
          subdivision: string | null
          target_sale_price: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "otc_properties_county_state_id_fkey"
            columns: ["county_state_id"]
            isOneToOne: false
            referencedRelation: "counties_states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      property_status:
        | "new_detected"
        | "due_diligence"
        | "ready_to_buy"
        | "purchased"
        | "listed_for_sale"
        | "sold"
        | "rejected"
      us_state: "AR" | "MS" | "AL" | "FL" | "NM" | "AZ"
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
      property_status: [
        "new_detected",
        "due_diligence",
        "ready_to_buy",
        "purchased",
        "listed_for_sale",
        "sold",
        "rejected",
      ],
      us_state: ["AR", "MS", "AL", "FL", "NM", "AZ"],
    },
  },
} as const
