
-- Add phase tracking to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN current_phase text NOT NULL DEFAULT 'group_stage';

-- Add group tracking to players
ALTER TABLE public.players 
ADD COLUMN group_name text,
ADD COLUMN group_points integer DEFAULT 0,
ADD COLUMN group_sets_won integer DEFAULT 0,
ADD COLUMN group_sets_lost integer DEFAULT 0,
ADD COLUMN is_eliminated boolean DEFAULT false;

-- Add stage and group info to matches
ALTER TABLE public.matches 
ADD COLUMN stage text NOT NULL DEFAULT 'knockout',
ADD COLUMN group_name text,
ADD COLUMN sets_to_win integer DEFAULT 3,
ADD COLUMN player1_sets integer DEFAULT 0,
ADD COLUMN player2_sets integer DEFAULT 0;

-- Update default game_mode to 301
ALTER TABLE public.tournaments 
ALTER COLUMN game_mode SET DEFAULT '301';
