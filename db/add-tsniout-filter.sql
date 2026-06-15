-- Modesty filter: hide secular album/artist art (show generic cover instead).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tsniout_filter_enabled boolean NOT NULL DEFAULT false;
