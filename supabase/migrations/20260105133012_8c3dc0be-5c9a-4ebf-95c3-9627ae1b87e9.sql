-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('501', '201')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this tournament app)
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Anyone can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tournaments" ON public.tournaments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tournaments" ON public.tournaments FOR DELETE USING (true);

CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone can create players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Anyone can create matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update matches" ON public.matches FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete matches" ON public.matches FOR DELETE USING (true);