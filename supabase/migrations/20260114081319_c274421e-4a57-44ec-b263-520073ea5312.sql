-- Add tournament_format column to tournaments table
-- 'group' = traditional group stage format
-- 'league' = Champions League style where everyone plays X matches
ALTER TABLE public.tournaments 
ADD COLUMN tournament_format text NOT NULL DEFAULT 'group';

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.tournament_format IS 'Tournament format: group (traditional groups) or league (Champions League style round-robin)';