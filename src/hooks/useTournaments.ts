import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateBracket } from "@/lib/bracketGenerator";
import { generateGroups, generateGroupMatches } from "@/lib/groupGenerator";

export interface Tournament {
  id: string;
  name: string;
  date: string;
  game_mode: string;
  status: string;
  current_phase: string;
  created_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  group_name: string | null;
  group_points: number;
  group_sets_won: number;
  group_sets_lost: number;
  is_eliminated: boolean;
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
  player1_sets: number;
  player2_sets: number;
  sets_to_win: number;
  status: string;
  stage: string;
  group_name: string | null;
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
      playerNames,
    }: {
      name: string;
      date: string;
      playerNames: string[];
    }) => {
      // Create tournament with 301 game mode and group stage
      const { data: tournament, error: tournamentError } = await supabase
        .from("tournaments")
        .insert({ 
          name, 
          date, 
          game_mode: "301",
          current_phase: "group_stage"
        })
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

      // Generate groups
      const groups = generateGroups(
        players.map(p => ({ id: p.id, name: p.name, seed: p.seed || undefined }))
      );

      // Update players with group assignments
      for (const group of groups) {
        await supabase
          .from("players")
          .update({ group_name: group.name })
          .in("id", group.playerIds);
      }

      // Generate group matches
      const groupMatches = generateGroupMatches(groups);
      
      const groupMatchesToInsert = groupMatches.map((match, index) => ({
        tournament_id: tournament.id,
        round: 0, // Round 0 for group stage
        match_number: index + 1,
        player1_id: match.player1Id,
        player2_id: match.player2Id,
        stage: "group",
        group_name: match.groupName,
        sets_to_win: 2, // First to 2 sets in group stage
      }));

      const { error: matchesError } = await supabase
        .from("matches")
        .insert(groupMatchesToInsert);

      if (matchesError) throw matchesError;

      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateGroupMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      winnerId,
      loserId,
      player1Sets,
      player2Sets,
      tournamentId,
    }: {
      matchId: string;
      winnerId: string;
      loserId: string;
      player1Sets: number;
      player2Sets: number;
      tournamentId: string;
    }) => {
      // Update the match
      const { data: match, error } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_sets: player1Sets,
          player2_sets: player2Sets,
          status: "completed",
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;

      // Update winner's stats
      const { data: winner } = await supabase
        .from("players")
        .select("*")
        .eq("id", winnerId)
        .single();

      if (winner) {
        const winnerSets = match.player1_id === winnerId ? player1Sets : player2Sets;
        const loserSets = match.player1_id === winnerId ? player2Sets : player1Sets;
        
        await supabase
          .from("players")
          .update({
            group_points: (winner.group_points || 0) + 2,
            group_sets_won: (winner.group_sets_won || 0) + winnerSets,
            group_sets_lost: (winner.group_sets_lost || 0) + loserSets,
          })
          .eq("id", winnerId);
      }

      // Update loser's stats
      const { data: loser } = await supabase
        .from("players")
        .select("*")
        .eq("id", loserId)
        .single();

      if (loser) {
        const loserSets = match.player1_id === loserId ? player1Sets : player2Sets;
        const winnerSets = match.player1_id === loserId ? player2Sets : player1Sets;
        
        await supabase
          .from("players")
          .update({
            group_sets_won: (loser.group_sets_won || 0) + loserSets,
            group_sets_lost: (loser.group_sets_lost || 0) + winnerSets,
          })
          .eq("id", loserId);
      }

      // Check if group stage is complete
      const { data: allGroupMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("stage", "group");

      const allCompleted = allGroupMatches?.every(m => m.status === "completed");

      if (allCompleted) {
        // Eliminate last place in each group and start knockout
        await eliminateLastPlaceAndStartKnockout(tournamentId);
      }

      return match;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["matches", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["players", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournament", variables.tournamentId] });
    },
  });
}

async function eliminateLastPlaceAndStartKnockout(tournamentId: string) {
  // Get all players grouped by group_name
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (!players) return;

  // Group players by group_name
  const groupedPlayers: Record<string, typeof players> = {};
  for (const player of players) {
    if (player.group_name) {
      if (!groupedPlayers[player.group_name]) {
        groupedPlayers[player.group_name] = [];
      }
      groupedPlayers[player.group_name].push(player);
    }
  }

  // Sort all players across all groups by performance
  const allPlayersSorted = [...players]
    .filter(p => p.group_name)
    .sort((a, b) => {
      // Sort by points first, then sets difference
      if (b.group_points !== a.group_points) {
        return b.group_points - a.group_points;
      }
      return (b.group_sets_won - b.group_sets_lost) - (a.group_sets_won - a.group_sets_lost);
    });

  // Determine how many should advance (always 8 if > 8 players)
  const totalPlayers = players.length;
  const targetAdvancing = totalPlayers > 8 ? 8 : totalPlayers;
  
  // Take top performers
  const advancingPlayerIds = allPlayersSorted.slice(0, targetAdvancing).map(p => p.id);
  
  // Mark eliminated players
  const eliminatedIds = allPlayersSorted.slice(targetAdvancing).map(p => p.id);
  
  for (const id of eliminatedIds) {
    await supabase
      .from("players")
      .update({ is_eliminated: true })
      .eq("id", id);
  }

  // Generate knockout bracket
  const { data: advancingPlayers } = await supabase
    .from("players")
    .select("*")
    .in("id", advancingPlayerIds);

  if (!advancingPlayers || advancingPlayers.length < 2) return;

  // Shuffle players for random matchups
  const shuffled = [...advancingPlayers].sort(() => Math.random() - 0.5);

  const bracket = generateBracket(
    shuffled.map(p => ({ id: p.id, name: p.name, seed: p.seed || undefined }))
  );

  // Create knockout matches
  const knockoutMatchesToInsert = bracket.map(match => ({
    tournament_id: tournamentId,
    round: match.round,
    match_number: match.matchNumber,
    player1_id: match.player1Id,
    player2_id: match.player2Id,
    stage: "knockout",
    sets_to_win: 3, // First to 3 sets in knockout
  }));

  await supabase.from("matches").insert(knockoutMatchesToInsert);

  // Update tournament phase
  await supabase
    .from("tournaments")
    .update({ current_phase: "knockout", status: "active" })
    .eq("id", tournamentId);
}

export function useUpdateKnockoutMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      winnerId,
      player1Sets,
      player2Sets,
      tournamentId,
    }: {
      matchId: string;
      winnerId: string;
      player1Sets: number;
      player2Sets: number;
      tournamentId: string;
    }) => {
      // Update the match
      const { data: match, error } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_sets: player1Sets,
          player2_sets: player2Sets,
          player1_score: player1Sets,
          player2_score: player2Sets,
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
        .eq("stage", "knockout")
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
        const knockoutMatches = allMatches;
        const completedKnockout = knockoutMatches.filter(
          (m) => m.status === "completed" || m.id === matchId
        ).length;
        
        if (completedKnockout === knockoutMatches.length) {
          await supabase
            .from("tournaments")
            .update({ status: "completed", current_phase: "completed" })
            .eq("id", tournamentId);
        }
      }

      return match;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["matches", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament", variables.tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["players", variables.tournamentId] });
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
