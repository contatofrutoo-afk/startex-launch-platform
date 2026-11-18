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
      community_message_likes: {
        Row: {
          created_at: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_message_likes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mentioned_user_ids: string[]
          parent_id: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          mentioned_user_ids?: string[]
          parent_id?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentioned_user_ids?: string[]
          parent_id?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_thread_members: {
        Row: {
          created_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "community_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      community_threads: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_private: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_private?: boolean
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_private?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_media: {
        Row: {
          lesson_id: string
          materials: Json
          source_type: string
          updated_at: string
          video_path: string | null
          youtube_url: string | null
        }
        Insert: {
          lesson_id: string
          materials?: Json
          source_type?: string
          updated_at?: string
          video_path?: string | null
          youtube_url?: string | null
        }
        Update: {
          lesson_id?: string
          materials?: Json
          source_type?: string
          updated_at?: string
          video_path?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_media_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          lesson_id: string
          progress_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          lesson_id: string
          progress_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          lesson_id?: string
          progress_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string
          duration_seconds: number
          id: string
          is_free_preview: boolean
          is_sample: boolean
          position: number
          published: boolean
          thumbnail_url: string | null
          title: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_seconds?: number
          id?: string
          is_free_preview?: boolean
          is_sample?: boolean
          position?: number
          published?: boolean
          thumbnail_url?: string | null
          title: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_seconds?: number
          id?: string
          is_free_preview?: boolean
          is_sample?: boolean
          position?: number
          published?: boolean
          thumbnail_url?: string | null
          title?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number | null
          created_at: string
          id: string
          product_id: string
          provider: string | null
          provider_payment_intent_id: string | null
          provider_session_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          id?: string
          product_id: string
          provider?: string | null
          provider_payment_intent_id?: string | null
          provider_session_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          id?: string
          product_id?: string
          provider?: string | null
          provider_payment_intent_id?: string | null
          provider_session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          access_token: string
          created_at: string
          enabled: boolean
          integrator_id: string
          notification_url: string
          pix_key: string
          provider: string
          public_key: string
          sandbox: boolean
          site_id: string
          statement_descriptor: string
          subscription_plan_id: string
          subscription_price_cents: number
          updated_at: string
          updated_by: string | null
          user_id: string
          webhook_secret: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          enabled?: boolean
          integrator_id?: string
          notification_url?: string
          pix_key?: string
          provider: string
          public_key?: string
          sandbox?: boolean
          site_id?: string
          statement_descriptor?: string
          subscription_plan_id?: string
          subscription_price_cents?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          webhook_secret?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          enabled?: boolean
          integrator_id?: string
          notification_url?: string
          pix_key?: string
          provider?: string
          public_key?: string
          sandbox?: boolean
          site_id?: string
          statement_descriptor?: string
          subscription_plan_id?: string
          subscription_price_cents?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          cover_url: string | null
          created_at: string
          description: string
          file_path: string | null
          id: string
          member_price_cents: number | null
          mercadopago_member_preference_id: string | null
          mercadopago_preference_id: string | null
          mercadopago_synced_at: string | null
          name: string
          price_cents: number
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          description?: string
          file_path?: string | null
          id?: string
          member_price_cents?: number | null
          mercadopago_member_preference_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_synced_at?: string | null
          name: string
          price_cents?: number
          slug: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          description?: string
          file_path?: string | null
          id?: string
          member_price_cents?: number | null
          mercadopago_member_preference_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_synced_at?: string | null
          name?: string
          price_cents?: number
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aceite_termos_em: string | null
          avatar_url: string
          cidade: string
          created_at: string
          email: string
          estado: string
          id: string
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          aceite_termos_em?: string | null
          avatar_url?: string
          cidade?: string
          created_at?: string
          email?: string
          estado?: string
          id: string
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Update: {
          aceite_termos_em?: string | null
          avatar_url?: string
          cidade?: string
          created_at?: string
          email?: string
          estado?: string
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_cards: {
        Row: {
          avatar_url: string | null
          cidade: string
          contato: string
          created_at: string
          descricao: string
          estado: string
          id: string
          nome: string
          patrocinado: boolean
          servico: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cidade?: string
          contato?: string
          created_at?: string
          descricao?: string
          estado?: string
          id?: string
          nome?: string
          patrocinado?: boolean
          servico?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cidade?: string
          contato?: string
          created_at?: string
          descricao?: string
          estado?: string
          id?: string
          nome?: string
          patrocinado?: boolean
          servico?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          description: string
          id: string
          join_url: string | null
          replay_url: string | null
          starts_at: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          join_url?: string | null
          replay_url?: string | null
          starts_at: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          join_url?: string | null
          replay_url?: string | null
          starts_at?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          acesso_manual: boolean
          created_at: string
          current_period_end: string | null
          id: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acesso_manual?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acesso_manual?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string
          id: string
          is_sample: boolean
          position: number
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_sample?: boolean
          position?: number
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_sample?: boolean
          position?: number
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      community_profiles: {
        Row: {
          avatar_url: string | null
          cidade: string | null
          estado: string | null
          id: string | null
          nome: string | null
        }
        Insert: {
          avatar_url?: never
          cidade?: never
          estado?: never
          id?: string | null
          nome?: never
        }
        Update: {
          avatar_url?: never
          cidade?: never
          estado?: never
          id?: string | null
          nome?: never
        }
        Relationships: []
      }
      marketplace_cards: {
        Row: {
          avatar_url: string | null
          cidade: string | null
          contato: string | null
          created_at: string | null
          descricao: string | null
          estado: string | null
          id: string | null
          nome: string | null
          patrocinado: boolean | null
          servico: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_community_message: {
        Args: { _message_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_community_thread: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      get_or_create_private_thread: {
        Args: { _other_user: string }
        Returns: string
      }
      get_public_subscription_price: {
        Args: never
        Returns: {
          price_cents: number
          updated_at: string
        }[]
      }
      has_active_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_thread_member: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      message_belongs_to_thread: {
        Args: { _message_id: string; _thread_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
