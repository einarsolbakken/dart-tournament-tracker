import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateBracket } from "@/lib/bracketGenerator";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  game_mode: string;
  status: string;
  created_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_score: number;
  player2_score: number;
  status: string;
  created_at: string;
}

export function useTournaments() {
  return useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Tournament[];
    },
  });
}

export function useTournament(id: string) {
  return useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Tournament | null;
    },
    enabled: !!id,
  });
}

export function usePlayers(tournamentId: string) {
  return useQuery({
    queryKey: ["players", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed", { ascending: true });
      
      if (error) throw error;
      return data as Player[];
    },
    enabled: !!tournamentId,
  });
}

export function useMatches(tournamentId: string) {
  return useQuery({
    queryKey: ["matches", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });
      
      if (error) throw error;
      return data as Match[];
    },
    enabled: !!tournamentId,
  });
}

export function useCreateTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      date,
      gameMode,
      playerNames,
    }: {
      name: string;
      date: string;
      gameMode: string;
      playerNames: string[];
    }) => {
      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({ name, date, game_mode: gameMode })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Create players
      const playersToInsert = playerNames.map((playerName, index) => ({
        tournament_id: tournament.id,
        name: playerName,
        seed: index + 1,
      }));

      const { data: players, error: playersError } = await supabase
        .from("players")
        .insert(playersToInsert)
        .select();

      if (playersError) throw playersError;

      // Generate bracket
      const bracket = generateBracket(
        players.map((p) => ({ id: p.id, name: p.name, seed: p.seed || undefined }))
      );

      // Create matches
      const matchesToInsert = bracket.map((match) => ({
        tournament_id: tournament.id,
        round: match.round,
        match_number: match.matchNumber,
        player1_id: match.player1Id,
        player2_id: match.player2Id,
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(matchesToInsert);

      if (matchesError) throw matchesError;

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      winnerId,
      player1Score,
      player2Score,
      tournamentId,
    }: {
      matchId: string;
      winnerId: string;
      player1Score: number;
      player2Score: number;
      tournamentId: string;
    }) => {
      // Update the match
      const { data: match, error } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_score: player1Score,
          player2_score: player2Score,
          status: "completed",
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;

      // Find the next match and update it with the winner
      const { data: allMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

      if (allMatches) {
        const currentMatch = match;
        const nextRound = currentMatch.round + 1;
        const nextMatchNumber = Math.ceil(currentMatch.match_number / 2);

        const nextMatch = allMatches.find(
          (m) => m.round === nextRound && m.match_number === nextMatchNumber
        );

        if (nextMatch) {
          const isFirstPlayer = currentMatch.match_number % 2 === 1;
          const updateData = isFirstPlayer
            ? { player1_id: winnerId }
            : { player2_id: winnerId };

          await supabase
            .from("matches")
            .update(updateData)
            .eq("id", nextMatch.id);
        }

        // Check if tournament is complete
        const completedMatches = allMatches.filter(
          (m) => m.status === "completed" || m.id === matchId
        ).length;
        
        if (completedMatches === allMatches.length) {
          await supabase
            .from("tournaments")
            .update({ status: "completed" })
            .eq("id", tournamentId);
        } else {
          await supabase
            .from("tournaments")
            .update({ status: "active" })
            .eq("id", tournamentId);
        }
      }

      return match;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["matches", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", variables.tournamentId] });
    },
  });
}

export function useDeleteTournament() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}
