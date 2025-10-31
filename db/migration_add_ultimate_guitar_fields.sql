-- Migration pour ajouter les nouveaux champs Ultimate Guitar
-- À exécuter sur votre base de données Supabase

-- Ajouter les nouveaux champs à la table songs
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS version integer,
ADD COLUMN IF NOT EXISTS version_description text,
ADD COLUMN IF NOT EXISTS rating numeric(3,2),
ADD COLUMN IF NOT EXISTS difficulty character varying,
ADD COLUMN IF NOT EXISTS artist_url text,
ADD COLUMN IF NOT EXISTS artist_image_url text,
ADD COLUMN IF NOT EXISTS song_image_url text,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS source_site character varying;

-- Ajouter la contrainte de validation pour le rating (seulement si elle n'existe pas)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'songs_rating_check' 
        AND table_name = 'songs'
    ) THEN
        ALTER TABLE public.songs 
        ADD CONSTRAINT songs_rating_check CHECK (rating >= 0 AND rating <= 5);
    END IF;
END $$;

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_songs_artist_url ON public.songs(artist_url) WHERE artist_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_difficulty ON public.songs(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_rating ON public.songs(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_version ON public.songs(version) WHERE version IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_source_site ON public.songs(source_site) WHERE source_site IS NOT NULL;

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN public.songs.version IS 'Numéro de version de la partition (ex: 2 pour "Perfect (version 2)")';
COMMENT ON COLUMN public.songs.version_description IS 'Description des changements dans cette version';
COMMENT ON COLUMN public.songs.rating IS 'Note de la partition (0-5)';
COMMENT ON COLUMN public.songs.difficulty IS 'Niveau de difficulté (novice, intermediate, advanced, etc.)';
COMMENT ON COLUMN public.songs.artist_url IS 'URL de la page de l''artiste pour les suggestions';
COMMENT ON COLUMN public.songs.artist_image_url IS 'URL de l''image de l''artiste';
COMMENT ON COLUMN public.songs.song_image_url IS 'URL de l''image de l''album/chanson';
COMMENT ON COLUMN public.songs.source_url IS 'URL originale de la partition';
COMMENT ON COLUMN public.songs.source_site IS 'Site source (Ultimate Guitar, Tab4U, etc.)';
