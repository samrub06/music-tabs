-- Seed initial chord data with difficulty and learning_order
-- This file inserts all the chords from ChordsClient into the database

-- Open Chords (Beginner, learning_order 1-16)
INSERT INTO public.chords (name, chord_data, section, tuning, difficulty, learning_order) VALUES
('C Major', '{"chord": [[1, 0], [2, 1], [3, 0], [4, 2], [5, 3]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 1),
('A Minor', '{"chord": [[1, 0], [2, 1], [3, 2], [4, 2], [5, 0], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 2),
('D Major', '{"chord": [[1, 2], [2, 3], [3, 2], [4, 0], [5, "x"], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 3),
('E Major', '{"chord": [[1, 0], [2, 0], [3, 1], [4, 2], [5, 2], [6, 0]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 4),
('E Minor', '{"chord": [[1, 0], [2, 0], [3, 0], [4, 2], [5, 2], [6, 0]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 5),
('G Major', '{"chord": [[1, 3], [2, 3], [3, 0], [4, 0], [5, 2], [6, 3]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 6),
('A Major', '{"chord": [[1, 0], [2, 2], [3, 2], [4, 2], [5, 0], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 7),
('D Minor', '{"chord": [[1, 1], [2, 3], [3, 2], [4, 0], [5, "x"], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 8),
('C7', '{"chord": [[1, 0], [2, 1], [3, 3], [4, 2], [5, 3], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 9),
('D7', '{"chord": [[1, 2], [2, 1], [3, 2], [4, 0], [5, "x"], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 10),
('E7', '{"chord": [[1, 0], [2, 3], [3, 1], [4, 0], [5, 2], [6, 0]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 11),
('G7', '{"chord": [[1, 1], [2, 0], [3, 0], [4, 0], [5, 2], [6, 3]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 12),
('A7', '{"chord": [[1, 0], [2, 2], [3, 0], [4, 2], [5, 0], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 13),
('Am7', '{"chord": [[1, 0], [2, 1], [3, 0], [4, 2], [5, 0], [6, "x"]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 14),
('Em7', '{"chord": [[1, 0], [2, 3], [3, 0], [4, 0], [5, 2], [6, 0]], "position": 0, "barres": []}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 15),
('Dm7', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 0], [5, "x"], [6, "x"]], "position": 0, "barres": [{"fromString": 2, "toString": 1, "fret": 1}]}'::jsonb, 'Open Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'beginner', 16),

-- E-Shape Barre Chords (Intermediate, learning_order 1001-1005)
('F Major', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 3], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1001),
('F Minor', '{"chord": [[1, 1], [2, 1], [3, 1], [4, 3], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1002),
('F# Major', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 4], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 6, "toString": 1, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1003),
('F# Minor', '{"chord": [[1, 2], [2, 2], [3, 2], [4, 4], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 6, "toString": 1, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1004),
('G Major (Barre)', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 5], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1005),

-- A-Shape Barre Chords (Intermediate, learning_order 1101-1104)
('Bb Major', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 3], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 5, "toString": 1, "fret": 1}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1101),
('Bb Minor', '{"chord": [[1, 1], [2, 1], [3, 1], [4, 3], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 5, "toString": 1, "fret": 1}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1102),
('B Major', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 4], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1103),
('C Major (Barre)', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 5], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1104)
ON CONFLICT (name, section) DO UPDATE SET 
  difficulty = EXCLUDED.difficulty, 
  learning_order = EXCLUDED.learning_order,
  chord_data = EXCLUDED.chord_data,
  tuning = EXCLUDED.tuning,
  updated_at = now();
