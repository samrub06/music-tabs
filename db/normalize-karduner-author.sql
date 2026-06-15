-- Normalize Karduner catalog author to a single English name.
UPDATE songs
SET author = 'Yosef Karduner',
    updated_at = now()
WHERE author ILIKE '%kardun%'
   OR author LIKE '%קארדונר%';
