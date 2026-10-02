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
      bookmarks: {
        Row: {
          content_item_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_members: {
        Row: {
          added_at: string
          cluster_id: string
          content_item_id: string
          similarity: number | null
        }
        Insert: {
          added_at?: string
          cluster_id: string
          content_item_id: string
          similarity?: number | null
        }
        Update: {
          added_at?: string
          cluster_id?: string
          content_item_id?: string
          similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "content_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_members_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analysis: {
        Row: {
          action_required: boolean
          category: string
          content_item_id: string
          created_at: string
          deadline: string | null
          event_name: string | null
          id: string
          keywords: string[]
          model: string | null
          organizations: string[]
          people: string[]
          raw_response: Json | null
          suggested_priority_reason: string | null
          summary: string
          updated_at: string
          urgency: number
        }
        Insert: {
          action_required?: boolean
          category: string
          content_item_id: string
          created_at?: string
          deadline?: string | null
          event_name?: string | null
          id?: string
          keywords?: string[]
          model?: string | null
          organizations?: string[]
          people?: string[]
          raw_response?: Json | null
          suggested_priority_reason?: string | null
          summary: string
          updated_at?: string
          urgency: number
        }
        Update: {
          action_required?: boolean
          category?: string
          content_item_id?: string
          created_at?: string
          deadline?: string | null
          event_name?: string | null
          id?: string
          keywords?: string[]
          model?: string | null
          organizations?: string[]
          people?: string[]
          raw_response?: Json | null
          suggested_priority_reason?: string | null
          summary?: string
          updated_at?: string
          urgency?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_analysis_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_clusters: {
        Row: {
          combined_summary: string | null
          created_at: string
          id: string
          primary_content_item_id: string | null
          source_count: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          combined_summary?: string | null
          created_at?: string
          id?: string
          primary_content_item_id?: string | null
          source_count?: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          combined_summary?: string | null
          created_at?: string
          id?: string
          primary_content_item_id?: string | null
          source_count?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_clusters_primary_content_item_id_fkey"
            columns: ["primary_content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_embeddings: {
        Row: {
          content_item_id: string
          created_at: string
          embedding: string
          model: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          embedding: string
          model: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          embedding?: string
          model?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_embeddings_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          author: string | null
          content: string | null
          content_hash: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          original_url: string | null
          published_at: string | null
          raw_data: Json | null
          source: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          original_url?: string | null
          published_at?: string | null
          raw_data?: Json | null
          source: string
          source_id?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          content_hash?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          original_url?: string | null
          published_at?: string | null
          raw_data?: Json | null
          source?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          adapter_key: string
          category: string | null
          config: Json
          created_at: string
          enabled: boolean
          feed_url: string | null
          id: string
          is_global: boolean
          last_fetched_at: string | null
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          adapter_key: string
          category?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          feed_url?: string | null
          id?: string
          is_global?: boolean
          last_fetched_at?: string | null
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          adapter_key?: string
          category?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          feed_url?: string | null
          id?: string
          is_global?: boolean
          last_fetched_at?: string | null
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      digest_items: {
        Row: {
          content_item_id: string
          created_at: string
          digest_id: string
          position: number
          score: number
          section: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          digest_id: string
          position?: number
          score: number
          section: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          digest_id?: string
          position?: number
          score?: number
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_items_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digest_items_digest_id_fkey"
            columns: ["digest_id"]
            isOneToOne: false
            referencedRelation: "digests"
            referencedColumns: ["id"]
          },
        ]
      }
      digests: {
        Row: {
          created_at: string
          estimated_reading_minutes: number
          handled_count: number
          id: string
          minutes_saved: number
          must_know_count: number
          period_end: string
          period_start: string
          raw_item_count: number
          summary: string | null
          user_id: string
          worth_knowing_count: number
        }
        Insert: {
          created_at?: string
          estimated_reading_minutes?: number
          handled_count?: number
          id?: string
          minutes_saved?: number
          must_know_count?: number
          period_end: string
          period_start: string
          raw_item_count?: number
          summary?: string | null
          user_id: string
          worth_knowing_count?: number
        }
        Update: {
          created_at?: string
          estimated_reading_minutes?: number
          handled_count?: number
          id?: string
          minutes_saved?: number
          must_know_count?: number
          period_end?: string
          period_start?: string
          raw_item_count?: number
          summary?: string | null
          user_id?: string
          worth_knowing_count?: number
        }
        Relationships: []
      }
      important_people: {
        Row: {
          created_at: string
          id: string
          name: string
          sender_identifier: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sender_identifier?: string | null
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sender_identifier?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          content_item_id: string | null
          created_at: string
          id: string
          scheduled_for: string | null
          score: number | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string | null
          score?: number | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          content_item_id?: string | null
          created_at?: string
          id?: string
          scheduled_for?: string | null
          score?: number | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      read_status: {
        Row: {
          content_item_id: string
          deprioritized: boolean
          hidden_at: string | null
          read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_item_id: string
          deprioritized?: boolean
          hidden_at?: string | null
          read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_item_id?: string
          deprioritized?: boolean
          hidden_at?: string | null
          read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "read_status_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      source_fetch_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: number
          items_created: number
          items_fetched: number
          response_meta: Json
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: never
          items_created?: number
          items_fetched?: number
          response_meta?: Json
          source_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: never
          items_created?: number
          items_fetched?: number
          response_meta?: Json
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_fetch_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          topic: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          topic: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          topic?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          cluster_similarity_threshold: number
          created_at: string
          digest_every_hours: number | null
          digest_frequency: Database["public"]["Enums"]["digest_frequency"]
          notification_threshold: number
          quiet_end: string
          quiet_hours_enabled: boolean
          quiet_start: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cluster_similarity_threshold?: number
          created_at?: string
          digest_every_hours?: number | null
          digest_frequency?: Database["public"]["Enums"]["digest_frequency"]
          notification_threshold?: number
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cluster_similarity_threshold?: number
          created_at?: string
          digest_every_hours?: number | null
          digest_frequency?: Database["public"]["Enums"]["digest_frequency"]
          notification_threshold?: number
          quiet_end?: string
          quiet_hours_enabled?: boolean
          quiet_start?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          created_at: string
          deadline: string | null
          details: string
          id: string
          priority: Database["public"]["Enums"]["priority_level"]
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          details?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          details?: string
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      digest_frequency: "morning" | "evening" | "every_x_hours" | "manual"
      priority_level: "low" | "medium" | "high"
      source_type:
        | "news"
        | "technology"
        | "research"
        | "youtube"
        | "sports"
        | "social"
        | "rss"
        | "college"
        | "weather"
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
      digest_frequency: ["morning", "evening", "every_x_hours", "manual"],
      priority_level: ["low", "medium", "high"],
      source_type: [
        "news",
        "technology",
        "research",
        "youtube",
        "sports",
        "social",
        "rss",
        "college",
        "weather",
      ],
    },
  },
} as const
