-- Migration pour ajouter les colonnes genre et decade à la table songs
-- À exécuter sur votre base de données Supabase

-- Ajouter la colonne genre (text, nullable) pour stocker l'ID du genre Ultimate Guitar
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS genre text;

-- Ajouter la colonne decade (integer, nullable) pour stocker l'année de la décennie
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS decade integer;

-- Le champ difficulty existe déjà et peut accepter des valeurs textuelles ou numériques
-- On va le laisser tel quel car il peut stocker "1", "2", "novice", "intermediate", etc.

-- Créer des index pour améliorer les performances de filtrage
CREATE INDEX IF NOT EXISTS idx_songs_genre ON public.songs(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_decade ON public.songs(decade) WHERE decade IS NOT NULL;

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN public.songs.genre IS 'ID du genre Ultimate Guitar (ex: "4" pour Rock, "14" pour Pop)';
COMMENT ON COLUMN public.songs.decade IS 'Année de la décennie (ex: 2020 pour les années 2020, 2010 pour les années 2010)';
