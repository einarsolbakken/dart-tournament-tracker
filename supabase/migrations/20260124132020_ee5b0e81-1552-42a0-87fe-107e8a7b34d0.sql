-- Add column for checkout suggestions toggle
ALTER TABLE public.tournaments 
ADD COLUMN show_checkout_suggestions BOOLEAN NOT NULL DEFAULT true;