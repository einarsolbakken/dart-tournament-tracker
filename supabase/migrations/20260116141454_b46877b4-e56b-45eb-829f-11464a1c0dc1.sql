-- Add tournament rule configuration columns
ALTER TABLE public.tournaments
ADD COLUMN group_sets_to_win integer NOT NULL DEFAULT 2,
ADD COLUMN knockout_sets_to_win integer NOT NULL DEFAULT 3,
ADD COLUMN group_checkout_type text NOT NULL DEFAULT 'single',
ADD COLUMN knockout_checkout_type text NOT NULL DEFAULT 'double';

-- Add comment for documentation
COMMENT ON COLUMN public.tournaments.group_sets_to_win IS 'Number of sets needed to win in group/league stage';
COMMENT ON COLUMN public.tournaments.knockout_sets_to_win IS 'Number of sets needed to win in knockout stage';
COMMENT ON COLUMN public.tournaments.group_checkout_type IS 'Checkout type for group/league: single or double';
COMMENT ON COLUMN public.tournaments.knockout_checkout_type IS 'Checkout type for knockout: single or double';