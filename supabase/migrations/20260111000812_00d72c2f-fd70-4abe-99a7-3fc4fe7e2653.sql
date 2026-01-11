-- Add columns for tracking darts thrown and total score for avg calculation
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS player1_total_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS player1_darts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_total_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_darts integer DEFAULT 0;

-- Add aggregate columns for players to track total darts and total score across all matches
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS total_darts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_score integer DEFAULT 0;