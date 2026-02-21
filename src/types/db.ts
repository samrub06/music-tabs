export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          preferred_instrument: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_instrument?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          preferred_instrument?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
          display_order: number | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
          display_order?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
          display_order?: number | null
        }
      }
      songs: {
        Row: {
          id: string
          user_id: string | null
          title: string
          author: string | null
          folder_id: string | null
          created_at: string
          updated_at: string
          capo: number | null
          first_chord: string | null
          last_chord: string | null
          chord_progression: string[] | null
          key: string | null
          sounding_key: string | null
          reviews: number | null
          tab_id: string | null
          version: number | null
          version_description: string | null
          rating: number | null
          difficulty: string | null
          artist_url: string | null
          artist_image_url: string | null
          song_image_url: string | null
          source_url: string | null
          source_site: string | null
          view_count: number | null
          format: string | null
          sections: Json | null
          is_public: boolean
          is_trending: boolean
          genre: string | null
          decade: number | null
          bpm: number | null
          all_chords: string[] | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          author?: string | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
          capo?: number | null
          first_chord?: string | null
          last_chord?: string | null
          chord_progression?: string[] | null
          key?: string | null
          sounding_key?: string | null
          reviews?: number | null
          tab_id?: string | null
          version?: number | null
          version_description?: string | null
          rating?: number | null
          difficulty?: string | null
          artist_url?: string | null
          artist_image_url?: string | null
          song_image_url?: string | null
          source_url?: string | null
          source_site?: string | null
          view_count?: number | null
          format?: string | null
          sections?: Json | null
          is_public?: boolean
          is_trending?: boolean
          genre?: string | null
          decade?: number | null
          bpm?: number | null
          all_chords?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          author?: string | null
          folder_id?: string | null
          created_at?: string
          updated_at?: string
          capo?: number | null
          first_chord?: string | null
          last_chord?: string | null
          chord_progression?: string[] | null
          key?: string | null
          sounding_key?: string | null
          reviews?: number | null
          tab_id?: string | null
          version?: number | null
          version_description?: string | null
          rating?: number | null
          difficulty?: string | null
          artist_url?: string | null
          artist_image_url?: string | null
          song_image_url?: string | null
          source_url?: string | null
          source_site?: string | null
          view_count?: number | null
          format?: string | null
          sections?: Json | null
          is_public?: boolean
          is_trending?: boolean
          genre?: string | null
          decade?: number | null
          bpm?: number | null
          all_chords?: string[] | null
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          song_ids: string[]
          created_at: string
          updated_at: string
          is_public?: boolean
          image_url?: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          song_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          song_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      chords: {
        Row: {
          id: string
          name: string
          chord_data: Json
          section: string
          tuning: string[]
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          learning_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          chord_data: Json
          section: string
          tuning?: string[]
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          learning_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          chord_data?: Json
          section?: string
          tuning?: string[]
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          learning_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      user_known_chords: {
        Row: {
          id: string
          user_id: string
          chord_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chord_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chord_id?: string
          created_at?: string
        }
      }
      user_stats: {
        Row: {
          user_id: string
          total_xp: number
          current_level: number
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          total_songs_created: number
          total_songs_viewed: number
          total_folders_created: number
          total_playlists_created: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_songs_created?: number
          total_songs_viewed?: number
          total_folders_created?: number
          total_playlists_created?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          total_songs_created?: number
          total_songs_viewed?: number
          total_folders_created?: number
          total_playlists_created?: number
          created_at?: string
          updated_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          xp_amount: number
          action_type: string
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          xp_amount: number
          action_type: string
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          xp_amount?: number
          action_type?: string
          entity_id?: string | null
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          badge_key: string
          badge_name: string
          badge_description: string | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          badge_key: string
          badge_name: string
          badge_description?: string | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          badge_key?: string
          badge_name?: string
          badge_description?: string | null
          earned_at?: string
        }
      }
      daily_song_views: {
        Row: {
          id: string
          user_id: string
          song_id: string
          viewed_date: string
        }
        Insert: {
          id?: string
          user_id: string
          song_id: string
          viewed_date: string
        }
        Update: {
          id?: string
          user_id?: string
          song_id?: string
          viewed_date?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: {
          song_id: string
        }
        Returns: void
      }
      award_xp: {
        Args: {
          p_user_id: string
          p_xp_amount: number
          p_action_type: string
          p_entity_id: string | null
        }
        Returns: {
          total_xp: number
          current_level: number
          level_up: boolean
          old_level: number
          new_level: number
        }
      }
      update_streak: {
        Args: {
          p_user_id: string
        }
        Returns: {
          current_streak: number
          longest_streak: number
          streak_incremented: boolean
          daily_bonus_awarded: boolean
        }
      }
      increment_user_stat_counter: {
        Args: {
          p_user_id: string
          p_counter_name: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
