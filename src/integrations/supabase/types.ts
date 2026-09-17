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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      about_sections: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          section_type: string
          sort_order: number
          styling: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          section_type?: string
          sort_order?: number
          styling?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          section_type?: string
          sort_order?: number
          styling?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      about_settings: {
        Row: {
          created_at: string
          cta_description: string | null
          cta_subtitle: string | null
          cta_title: string | null
          hero_description: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          mission_items: Json | null
          stats_items: Json | null
          updated_at: string
          values_items: Json | null
          vision_description: string | null
          vision_title: string | null
        }
        Insert: {
          created_at?: string
          cta_description?: string | null
          cta_subtitle?: string | null
          cta_title?: string | null
          hero_description?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          mission_items?: Json | null
          stats_items?: Json | null
          updated_at?: string
          values_items?: Json | null
          vision_description?: string | null
          vision_title?: string | null
        }
        Update: {
          created_at?: string
          cta_description?: string | null
          cta_subtitle?: string | null
          cta_title?: string | null
          hero_description?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          mission_items?: Json | null
          stats_items?: Json | null
          updated_at?: string
          values_items?: Json | null
          vision_description?: string | null
          vision_title?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_name: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number | null
          slug: string
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      ballroom_bookings: {
        Row: {
          admin_notes: string | null
          booking_date: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          end_time: string | null
          event_name: string
          event_type: string | null
          guest_count: number | null
          id: string
          location_id: string
          midtrans_order_id: string | null
          midtrans_snap_token: string | null
          midtrans_transaction_id: string | null
          notes: string | null
          paid_at: string | null
          payment_amount: number
          payment_method: string | null
          payment_status: string
          payment_type: string
          session_id: string | null
          start_time: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_date: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at?: string
          end_time?: string | null
          event_name: string
          event_type?: string | null
          guest_count?: number | null
          id?: string
          location_id: string
          midtrans_order_id?: string | null
          midtrans_snap_token?: string | null
          midtrans_transaction_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number
          payment_method?: string | null
          payment_status?: string
          payment_type?: string
          session_id?: string | null
          start_time?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_date?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          end_time?: string | null
          event_name?: string
          event_type?: string | null
          guest_count?: number | null
          id?: string
          location_id?: string
          midtrans_order_id?: string | null
          midtrans_snap_token?: string | null
          midtrans_transaction_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_amount?: number
          payment_method?: string | null
          payment_status?: string
          payment_type?: string
          session_id?: string | null
          start_time?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ballroom_bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballroom_bookings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "venue_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ballroom_schedules: {
        Row: {
          created_at: string
          end_time: string | null
          event_name: string | null
          id: string
          location_id: string
          notes: string | null
          schedule_date: string
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          event_name?: string | null
          id?: string
          location_id: string
          notes?: string | null
          schedule_date: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          event_name?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          schedule_date?: string
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballroom_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          button_link: string | null
          button_size: string | null
          button_text: string | null
          button_visible: boolean | null
          button2_link: string | null
          button2_size: string | null
          button2_text: string | null
          button2_visible: boolean | null
          content_position: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          subtitle: string | null
          title: string
          title_size: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_size?: string | null
          button_text?: string | null
          button_visible?: boolean | null
          button2_link?: string | null
          button2_size?: string | null
          button2_text?: string | null
          button2_visible?: boolean | null
          content_position?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
          title_size?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_size?: string | null
          button_text?: string | null
          button_visible?: boolean | null
          button2_link?: string | null
          button2_size?: string | null
          button2_text?: string | null
          button2_visible?: boolean | null
          content_position?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          title_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          ballroom_layout_capacity: string | null
          ballroom_layout_description: string | null
          ballroom_layout_dimensions: string | null
          ballroom_layout_images: string[] | null
          category: string | null
          created_at: string
          dp_percentage: number
          email: string | null
          facilities: string[] | null
          facility_items: Json
          google_maps_url: string | null
          hero_video_url: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_coming_soon: boolean | null
          loading_area_capacity: string | null
          loading_area_description: string | null
          loading_area_dimensions: string | null
          loading_area_images: string[] | null
          matterport_360_url: string | null
          name: string
          operating_hours: Json | null
          phone: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          ballroom_layout_capacity?: string | null
          ballroom_layout_description?: string | null
          ballroom_layout_dimensions?: string | null
          ballroom_layout_images?: string[] | null
          category?: string | null
          created_at?: string
          dp_percentage?: number
          email?: string | null
          facilities?: string[] | null
          facility_items?: Json
          google_maps_url?: string | null
          hero_video_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          loading_area_capacity?: string | null
          loading_area_description?: string | null
          loading_area_dimensions?: string | null
          loading_area_images?: string[] | null
          matterport_360_url?: string | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          ballroom_layout_capacity?: string | null
          ballroom_layout_description?: string | null
          ballroom_layout_dimensions?: string | null
          ballroom_layout_images?: string[] | null
          category?: string | null
          created_at?: string
          dp_percentage?: number
          email?: string | null
          facilities?: string[] | null
          facility_items?: Json
          google_maps_url?: string | null
          hero_video_url?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          loading_area_capacity?: string | null
          loading_area_description?: string | null
          loading_area_dimensions?: string | null
          loading_area_images?: string[] | null
          matterport_360_url?: string | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          category: string | null
          created_at: string
          cta_label: string | null
          cta_link: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          auth_background_url: string | null
          created_at: string
          email: string | null
          facebook_link: string | null
          id: string
          instagram_link: string | null
          logo_url: string | null
          phone: string | null
          site_name: string
          tagline: string | null
          tiktok_link: string | null
          updated_at: string
          whatsapp_link: string | null
          youtube_link: string | null
        }
        Insert: {
          address?: string | null
          auth_background_url?: string | null
          created_at?: string
          email?: string | null
          facebook_link?: string | null
          id?: string
          instagram_link?: string | null
          logo_url?: string | null
          phone?: string | null
          site_name?: string
          tagline?: string | null
          tiktok_link?: string | null
          updated_at?: string
          whatsapp_link?: string | null
          youtube_link?: string | null
        }
        Update: {
          address?: string | null
          auth_background_url?: string | null
          created_at?: string
          email?: string | null
          facebook_link?: string | null
          id?: string
          instagram_link?: string | null
          logo_url?: string | null
          phone?: string | null
          site_name?: string
          tagline?: string | null
          tiktok_link?: string | null
          updated_at?: string
          whatsapp_link?: string | null
          youtube_link?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          photo_url: string | null
          rating: number | null
          role: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          photo_url?: string | null
          rating?: number | null
          role?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          photo_url?: string | null
          rating?: number | null
          role?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          bio: string | null
          certifications: string[] | null
          created_at: string
          hero_video_url: string | null
          id: string
          images: string[] | null
          instagram: string | null
          is_active: boolean | null
          location_id: string | null
          name: string
          photo_url: string | null
          sort_order: number | null
          specialization: string | null
          updated_at: string
          videos: string[] | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hero_video_url?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          is_active?: boolean | null
          location_id?: string | null
          name: string
          photo_url?: string | null
          sort_order?: number | null
          specialization?: string | null
          updated_at?: string
          videos?: string[] | null
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          hero_video_url?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          is_active?: boolean | null
          location_id?: string | null
          name?: string
          photo_url?: string | null
          sort_order?: number | null
          specialization?: string | null
          updated_at?: string
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "trainers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      venue_sessions: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          location_id: string
          name: string
          price: number
          sort_order: number
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean
          location_id: string
          name: string
          price?: number
          sort_order?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          location_id?: string
          name?: string
          price?: number
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_testimonials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          role: string | null
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
