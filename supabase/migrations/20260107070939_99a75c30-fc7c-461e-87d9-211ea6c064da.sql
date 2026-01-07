-- Drop existing constraint
ALTER TABLE public.tournaments DROP CONSTRAINT IF EXISTS tournaments_game_mode_check;

-- Add new constraint that includes 301
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_game_mode_check 
CHECK (game_mode = ANY (ARRAY['501', '301', '201']));