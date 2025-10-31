-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT folders_pkey PRIMARY KEY (id),
  CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id),
  CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.songs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  author character varying DEFAULT ''::character varying,
  folder_id uuid,
  format character varying DEFAULT 'structured'::character varying CHECK (format::text = 'structured'::text),
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  
  -- Champs existants
  reviews integer DEFAULT 0,
  capo integer,
  sounding_key text,
  key text,
  first_chord text,
  last_chord text,
  chord_progression ARRAY,
  
  -- Nouveaux champs pour Ultimate Guitar
  version integer,
  version_description text,
  rating numeric(3,2), -- Pour stocker des notes comme 4.85
  difficulty character varying, -- 'novice', 'intermediate', 'advanced', etc.
  artist_url text, -- URL de la page de l'artiste pour les suggestions
  artist_image_url text, -- URL de l'image de l'artiste
  song_image_url text, -- URL de l'image de l'album/chanson
  source_url text, -- URL originale de la partition (Ultimate Guitar, Tab4U, etc.)
  source_site character varying, -- 'Ultimate Guitar', 'Tab4U', etc.
  
  CONSTRAINT songs_pkey PRIMARY KEY (id),
  CONSTRAINT songs_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
  CONSTRAINT songs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT songs_rating_check CHECK (rating >= 0 AND rating <= 5)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_songs_artist_url ON public.songs(artist_url) WHERE artist_url IS NOT NULL;
CREATE INDEX idx_songs_difficulty ON public.songs(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX idx_songs_rating ON public.songs(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_songs_version ON public.songs(version) WHERE version IS NOT NULL;
CREATE INDEX idx_songs_source_site ON public.songs(source_site) WHERE source_site IS NOT NULL;
