import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateBracket } from "@/lib/bracketGenerator";
import { generateGroups, generateGroupMatches } from "@/lib/groupGenerator";
import { generateLeagueMatches, getDefaultMatchesPerPlayer, validateLeagueConfig } from "@/lib/leagueGenerator";
...
      } else {
        // League format: all players in one "league" (no groups)
        // Update all players with group_name "LEAGUE" for identification
        await supabase
          .from("players")
          .update({ group_name: "LEAGUE" })
          .eq("tournament_id", tournament.id);

        // Generate league matches with configurable matches per player
        const k = matchesPerPlayer ?? getDefaultMatchesPerPlayer(players.length);
        const leagueConfig = validateLeagueConfig(players.length, k);

        if (!leagueConfig.isValid) {
          throw new Error(leagueConfig.errorMessage || "Ugyldig ligaoppsett");
        }

        const leagueMatches = generateLeagueMatches(
          players.map(p => ({ id: p.id, name: p.name, seed: p.seed || undefined })),
          k
        );

        if (leagueMatches.length !== leagueConfig.totalMatches) {
          throw new Error(`Kunne ikke lage ligakamper. Forventet ${leagueConfig.totalMatches}, fikk ${leagueMatches.length}.`);
        }

        const leagueMatchesToInsert = leagueMatches.map((match) => ({
          tournament_id: tournament.id,
          round: 0, // Round 0 for league stage
          match_number: match.matchNumber,
          player1_id: match.player1Id,
          player2_id: match.player2Id,
          stage: "league",
          group_name: "LEAGUE",
          sets_to_win: groupSetsToWin,
        }));

        const { error: matchesError } = await supabase
          .from("matches")
          .insert(leagueMatchesToInsert);

        if (matchesError) throw matchesError;
      }

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
      player1TotalScore,
      player1Darts,
      player2TotalScore,
      player2Darts,
      tournamentId,
    }: {
      matchId: string;
      winnerId: string;
      loserId: string;
      player1Sets: number;
      player2Sets: number;
      player1TotalScore: number;
      player1Darts: number;
      player2TotalScore: number;
      player2Darts: number;
      tournamentId: string;
    }) => {
      // Update the match
      const { data: match, error } = await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_sets: player1Sets,
          player2_sets: player2Sets,
          player1_total_score: player1TotalScore,
          player1_darts: player1Darts,
          player2_total_score: player2TotalScore,
          player2_darts: player2Darts,
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
        const winnerDarts = match.player1_id === winnerId ? player1Darts : player2Darts;
        const winnerScoreThrown = match.player1_id === winnerId ? player1TotalScore : player2TotalScore;
        
        await supabase
          .from("players")
          .update({
            group_points: (winner.group_points || 0) + 2,
            group_sets_won: (winner.group_sets_won || 0) + winnerSets,
            group_sets_lost: (winner.group_sets_lost || 0) + loserSets,
            total_darts: (winner.total_darts || 0) + winnerDarts,
            total_score: (winner.total_score || 0) + winnerScoreThrown,
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
        const loserDarts = match.player1_id === loserId ? player1Darts : player2Darts;
        const loserScoreThrown = match.player1_id === loserId ? player1TotalScore : player2TotalScore;
        
        await supabase
          .from("players")
          .update({
            group_sets_won: (loser.group_sets_won || 0) + loserSets,
            group_sets_lost: (loser.group_sets_lost || 0) + winnerSets,
            total_darts: (loser.total_darts || 0) + loserDarts,
            total_score: (loser.total_score || 0) + loserScoreThrown,
          })
          .eq("id", loserId);
      }

      // Check if group/league stage is complete
      const { data: allStageMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .in("stage", ["group", "league"]);

      const allDone = allStageMatches?.every(m => m.status === "completed" || m.status === "skipped");

      if (allDone && allStageMatches && allStageMatches.length > 0) {
        // Check which stage type it is
        const isLeague = allStageMatches[0].stage === "league";
        // Eliminate players and start knockout
        await eliminateAndStartKnockout(tournamentId, isLeague);
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

// Helper function to calculate average per 3 darts
function calculatePlayerAvg(totalScore: number, totalDarts: number): number {
  if (totalDarts === 0) return 0;
  return (totalScore / totalDarts) * 3;
}

// Find the valid knockout size (must be 2, 4, 8, or 16)
function getValidKnockoutSize(playerCount: number): number {
  const validSizes = [16, 8, 4, 2];
  for (const size of validSizes) {
    if (playerCount >= size) {
      return size;
    }
  }
  return 2; // Minimum is always 2
}

async function eliminateAndStartKnockout(tournamentId: string, isLeague: boolean) {
  // Get tournament settings
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("knockout_sets_to_win")
    .eq("id", tournamentId)
    .single();

  const knockoutSetsToWin = tournament?.knockout_sets_to_win ?? 3;

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
  // Tiebreaker order: 1. Points, 2. Set difference, 3. Average per 3 darts
  const allPlayersSorted = [...players]
    .filter(p => p.group_name)
    .sort((a, b) => {
      // 1. Sort by points first
      if (b.group_points !== a.group_points) {
        return b.group_points - a.group_points;
      }
      // 2. Then by sets difference
      const aSetDiff = (a.group_sets_won || 0) - (a.group_sets_lost || 0);
      const bSetDiff = (b.group_sets_won || 0) - (b.group_sets_lost || 0);
      if (bSetDiff !== aSetDiff) {
        return bSetDiff - aSetDiff;
      }
      // 3. Then by average (higher is better)
      const aAvg = calculatePlayerAvg(a.total_score || 0, a.total_darts || 0);
      const bAvg = calculatePlayerAvg(b.total_score || 0, b.total_darts || 0);
      return bAvg - aAvg;
    });

  // Determine how many should advance (must be 16, 8, 4, or 2 - never anything else)
  const totalPlayers = allPlayersSorted.length;
  const targetAdvancing = getValidKnockoutSize(totalPlayers);
  
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

  // Sort advancing players by their ranking to maintain seeding
  const advancingPlayersSorted = [...advancingPlayers].sort((a, b) => {
    const aIndex = advancingPlayerIds.indexOf(a.id);
    const bIndex = advancingPlayerIds.indexOf(b.id);
    return aIndex - bIndex;
  });

  const bracket = generateBracket(
    advancingPlayersSorted.map((p, index) => ({ 
      id: p.id, 
      name: p.name, 
      seed: index + 1 // Use ranking from group stage as seed
    }))
  );

  // Create knockout matches
  const knockoutMatchesToInsert = bracket.map(match => ({
    tournament_id: tournamentId,
    round: match.round,
    match_number: match.matchNumber,
    player1_id: match.player1Id,
    player2_id: match.player2Id,
    stage: "knockout",
    sets_to_win: knockoutSetsToWin,
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
      player1TotalScore,
      player1Darts,
      player2TotalScore,
      player2Darts,
      tournamentId,
    }: {
      matchId: string;
      winnerId: string;
      player1Sets: number;
      player2Sets: number;
      player1TotalScore: number;
      player1Darts: number;
      player2TotalScore: number;
      player2Darts: number;
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
          player1_total_score: player1TotalScore,
          player1_darts: player1Darts,
          player2_total_score: player2TotalScore,
          player2_darts: player2Darts,
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

export function useSkipMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      tournamentId,
    }: {
      matchId: string;
      tournamentId: string;
    }) => {
      // Update the match to skipped status (no winner, no score changes)
      const { data: match, error } = await supabase
        .from("matches")
        .update({
          status: "skipped",
        })
        .eq("id", matchId)
        .select()
        .single();

      if (error) throw error;

      // Check if group/league stage is complete (all matches completed or skipped)
      const { data: allStageMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .in("stage", ["group", "league"]);

      const allDone = allStageMatches?.every(m => m.status === "completed" || m.status === "skipped");

      if (allDone && allStageMatches && allStageMatches.length > 0) {
        // Check which stage type it is
        const isLeague = allStageMatches[0].stage === "league";
        // Eliminate players and start knockout
        await eliminateAndStartKnockout(tournamentId, isLeague);
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
