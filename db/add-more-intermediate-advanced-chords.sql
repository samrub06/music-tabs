-- Add more intermediate and advanced chords
-- This file adds additional chords to expand the chord library

-- E-Shape Barre Chords (Intermediate, learning_order 1006-1020)
INSERT INTO public.chords (name, chord_data, section, tuning, difficulty, learning_order) VALUES
('G# Major', '{"chord": [[1, 4], [2, 4], [3, 5], [4, 6], [5, 6], [6, 4]], "position": 4, "barres": [{"fromString": 6, "toString": 1, "fret": 4}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1006),
('G# Minor', '{"chord": [[1, 4], [2, 4], [3, 4], [4, 6], [5, 6], [6, 4]], "position": 4, "barres": [{"fromString": 6, "toString": 1, "fret": 4}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1007),
('A Major (Barre)', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 7], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1008),
('A Minor (Barre)', '{"chord": [[1, 5], [2, 5], [3, 5], [4, 7], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1009),
('A# Major', '{"chord": [[1, 6], [2, 6], [3, 7], [4, 8], [5, 8], [6, 6]], "position": 6, "barres": [{"fromString": 6, "toString": 1, "fret": 6}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1010),
('A# Minor', '{"chord": [[1, 6], [2, 6], [3, 6], [4, 8], [5, 8], [6, 6]], "position": 6, "barres": [{"fromString": 6, "toString": 1, "fret": 6}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1011),
('B Major (Barre)', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 9], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 6, "toString": 1, "fret": 7}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1012),
('B Minor (Barre)', '{"chord": [[1, 7], [2, 7], [3, 7], [4, 9], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 6, "toString": 1, "fret": 7}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1013),
('C# Major', '{"chord": [[1, 9], [2, 9], [3, 10], [4, 11], [5, 11], [6, 9]], "position": 9, "barres": [{"fromString": 6, "toString": 1, "fret": 9}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1014),
('C# Minor', '{"chord": [[1, 9], [2, 9], [3, 9], [4, 11], [5, 11], [6, 9]], "position": 9, "barres": [{"fromString": 6, "toString": 1, "fret": 9}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1015),
('D# Major', '{"chord": [[1, 11], [2, 11], [3, 12], [4, 13], [5, 13], [6, 11]], "position": 11, "barres": [{"fromString": 6, "toString": 1, "fret": 11}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1016),
('D# Minor', '{"chord": [[1, 11], [2, 11], [3, 11], [4, 13], [5, 13], [6, 11]], "position": 11, "barres": [{"fromString": 6, "toString": 1, "fret": 11}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1017),

-- E-Shape 7th Chords (Intermediate, learning_order 1020-1030)
('F7', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1020),
('F#7', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 2], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 6, "toString": 1, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1021),
('G7 (Barre)', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1022),
('A7 (Barre)', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1023),
('B7 (Barre)', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 7], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 6, "toString": 1, "fret": 7}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1024),

-- A-Shape Barre Chords (Intermediate, learning_order 1105-1120)
('C# Major (A-Shape)', '{"chord": [[1, 4], [2, 4], [3, 5], [4, 6], [5, 6], [6, 4]], "position": 4, "barres": [{"fromString": 5, "toString": 1, "fret": 4}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1105),
('C# Minor (A-Shape)', '{"chord": [[1, 4], [2, 4], [3, 4], [4, 6], [5, 6], [6, 4]], "position": 4, "barres": [{"fromString": 5, "toString": 1, "fret": 4}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1106),
('D Major (Barre)', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 7], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1107),
('D Minor (Barre)', '{"chord": [[1, 5], [2, 5], [3, 5], [4, 7], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1108),
('D# Major', '{"chord": [[1, 6], [2, 6], [3, 7], [4, 8], [5, 8], [6, 6]], "position": 6, "barres": [{"fromString": 5, "toString": 1, "fret": 6}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1109),
('D# Minor', '{"chord": [[1, 6], [2, 6], [3, 6], [4, 8], [5, 8], [6, 6]], "position": 6, "barres": [{"fromString": 5, "toString": 1, "fret": 6}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1110),
('E Major (Barre)', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 9], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 5, "toString": 1, "fret": 7}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1111),
('E Minor (Barre)', '{"chord": [[1, 7], [2, 7], [3, 7], [4, 9], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 5, "toString": 1, "fret": 7}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1112),
('F Major (A-Shape)', '{"chord": [[1, 8], [2, 8], [3, 9], [4, 10], [5, 10], [6, 8]], "position": 8, "barres": [{"fromString": 5, "toString": 1, "fret": 8}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1113),
('F Minor (A-Shape)', '{"chord": [[1, 8], [2, 8], [3, 8], [4, 10], [5, 10], [6, 8]], "position": 8, "barres": [{"fromString": 5, "toString": 1, "fret": 8}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1114),
('F# Major (A-Shape)', '{"chord": [[1, 9], [2, 9], [3, 10], [4, 11], [5, 11], [6, 9]], "position": 9, "barres": [{"fromString": 5, "toString": 1, "fret": 9}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1115),
('F# Minor (A-Shape)', '{"chord": [[1, 9], [2, 9], [3, 9], [4, 11], [5, 11], [6, 9]], "position": 9, "barres": [{"fromString": 5, "toString": 1, "fret": 9}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1116),
('G Major (A-Shape)', '{"chord": [[1, 10], [2, 10], [3, 11], [4, 12], [5, 12], [6, 10]], "position": 10, "barres": [{"fromString": 5, "toString": 1, "fret": 10}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1117),
('G Minor (A-Shape)', '{"chord": [[1, 10], [2, 10], [3, 10], [4, 12], [5, 12], [6, 10]], "position": 10, "barres": [{"fromString": 5, "toString": 1, "fret": 10}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1118),
('G# Major (A-Shape)', '{"chord": [[1, 11], [2, 11], [3, 12], [4, 13], [5, 13], [6, 11]], "position": 11, "barres": [{"fromString": 5, "toString": 1, "fret": 11}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1119),
('G# Minor (A-Shape)', '{"chord": [[1, 11], [2, 11], [3, 11], [4, 13], [5, 13], [6, 11]], "position": 11, "barres": [{"fromString": 5, "toString": 1, "fret": 11}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1120),

-- A-Shape 7th Chords (Intermediate, learning_order 1121-1125)
('Bb7', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 5, "toString": 1, "fret": 1}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1121),
('B7 (A-Shape)', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 2], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1122),
('C7 (Barre)', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1123),
('D7 (Barre)', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1124),
('E7 (Barre)', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 7], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 5, "toString": 1, "fret": 7}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'intermediate', 1125),

-- Advanced Chords - Multiple Barres (learning_order 2001-2010)
('Fmaj7 (Barre)', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 2], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}, {"fromString": 4, "toString": 3, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2001),
('F#maj7 (Barre)', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 3], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 6, "toString": 1, "fret": 2}, {"fromString": 4, "toString": 3, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2002),
('Gmaj7 (Barre)', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 4], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}, {"fromString": 4, "toString": 3, "fret": 4}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2003),
('Amaj7 (Barre)', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 6], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}, {"fromString": 4, "toString": 3, "fret": 6}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2004),
('Bmaj7 (Barre)', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 8], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 6, "toString": 1, "fret": 7}, {"fromString": 4, "toString": 3, "fret": 8}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2005),

-- Advanced Chords - 9th Chords (learning_order 2011-2020)
('F9', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2011),
('G9', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2012),
('A9', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2013),
('Bb9', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 5, "toString": 1, "fret": 1}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2014),
('B9', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 2], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2015),
('C9', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2016),
('D9', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2017),
('E9', '{"chord": [[1, 7], [2, 7], [3, 8], [4, 7], [5, 9], [6, 7]], "position": 7, "barres": [{"fromString": 5, "toString": 1, "fret": 7}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2018),

-- Advanced Chords - Suspended and Add Chords (learning_order 2021-2030)
('Fsus2', '{"chord": [[1, 1], [2, 1], [3, 3], [4, 3], [5, 1], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2021),
('Fsus4', '{"chord": [[1, 1], [2, 1], [3, 3], [4, 3], [5, 1], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2022),
('Gadd9', '{"chord": [[1, 3], [2, 3], [3, 0], [4, 0], [5, 2], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2023),
('Aadd9', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 7], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2024),
('Bsus2', '{"chord": [[1, 2], [2, 2], [3, 4], [4, 4], [5, 2], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2025),
('Bsus4', '{"chord": [[1, 2], [2, 2], [3, 4], [4, 4], [5, 2], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2026),
('Csus2', '{"chord": [[1, 3], [2, 3], [3, 5], [4, 5], [5, 3], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2027),
('Csus4', '{"chord": [[1, 3], [2, 3], [3, 5], [4, 5], [5, 3], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2028),
('Dsus2', '{"chord": [[1, 5], [2, 5], [3, 7], [4, 7], [5, 5], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2029),
('Dsus4', '{"chord": [[1, 5], [2, 5], [3, 7], [4, 7], [5, 5], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2030),

-- Advanced Chords - Diminished and Augmented (learning_order 2031-2040)
('Fdim', '{"chord": [[1, 1], [2, 1], [3, 0], [4, 1], [5, 0], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2031),
('F#dim', '{"chord": [[1, 2], [2, 2], [3, 0], [4, 2], [5, 0], [6, 2]], "position": 2, "barres": [{"fromString": 6, "toString": 1, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2032),
('Gdim', '{"chord": [[1, 3], [2, 3], [3, 0], [4, 3], [5, 0], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2033),
('Faug', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 2], [5, 2], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}, {"fromString": 4, "toString": 3, "fret": 2}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2034),
('Gaug', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 4], [5, 4], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}, {"fromString": 4, "toString": 3, "fret": 4}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2035),
('Aaug', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 6], [5, 6], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}, {"fromString": 4, "toString": 3, "fret": 6}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2036),

-- Advanced Chords - 11th and 13th (learning_order 2041-2050)
('F11', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2041),
('G11', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2042),
('A11', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2043),
('F13', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 6, "toString": 1, "fret": 1}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2044),
('G13', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 6, "toString": 1, "fret": 3}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2045),
('A13', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 6, "toString": 1, "fret": 5}]}'::jsonb, 'E-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2046),
('Bb13', '{"chord": [[1, 1], [2, 1], [3, 2], [4, 1], [5, 3], [6, 1]], "position": 1, "barres": [{"fromString": 5, "toString": 1, "fret": 1}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2047),
('B13', '{"chord": [[1, 2], [2, 2], [3, 3], [4, 2], [5, 4], [6, 2]], "position": 2, "barres": [{"fromString": 5, "toString": 1, "fret": 2}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2048),
('C13', '{"chord": [[1, 3], [2, 3], [3, 4], [4, 3], [5, 5], [6, 3]], "position": 3, "barres": [{"fromString": 5, "toString": 1, "fret": 3}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2049),
('D13', '{"chord": [[1, 5], [2, 5], [3, 6], [4, 5], [5, 7], [6, 5]], "position": 5, "barres": [{"fromString": 5, "toString": 1, "fret": 5}]}'::jsonb, 'A-Shape Barre Chords', ARRAY['E', 'A', 'D', 'G', 'B', 'E'], 'advanced', 2050)
ON CONFLICT (name, section) DO UPDATE SET 
  difficulty = EXCLUDED.difficulty, 
  learning_order = EXCLUDED.learning_order,
  chord_data = EXCLUDED.chord_data,
  tuning = EXCLUDED.tuning,
  updated_at = now();

