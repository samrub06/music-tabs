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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
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
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
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
    }
    Enums: {
      [_ in never]: never
    }
  }
}
