import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Match, Player } from "./useTournaments";

interface SimulateMatchResult {
  winnerId: string;
  loserId: string;
  player1Sets: number;
  player2Sets: number;
  player1TotalScore: number;
  player1Darts: number;
  player2TotalScore: number;
  player2Darts: number;
}

function simulateSingleMatch(
  match: Match,
  gameMode: number,
  setsToWin: number
): SimulateMatchResult {
  let player1Sets = 0;
  let player2Sets = 0;
  let player1TotalScore = 0;
  let player2TotalScore = 0;
  let player1Darts = 0;
  let player2Darts = 0;

  // Simulate sets until someone wins
  while (player1Sets < setsToWin && player2Sets < setsToWin) {
    // Simulate a single set - random winner with slight randomness
    const player1Wins = Math.random() > 0.5;
    
    // Simulate darts thrown in this set (realistic range: 9-21 darts per set)
    const dartsThrown = Math.floor(Math.random() * 13) + 9;
    
    // Winner scores the game mode (e.g., 301), loser scores partially
    const winnerScore = gameMode;
    const loserScore = Math.floor(Math.random() * (gameMode - 50)) + 50; // Between 50 and gameMode-1
    
    if (player1Wins) {
      player1Sets++;
      player1TotalScore += winnerScore;
      player2TotalScore += loserScore;
    } else {
      player2Sets++;
      player2TotalScore += winnerScore;
      player1TotalScore += loserScore;
    }
    
    // Both players throw roughly the same number of darts per set
    player1Darts += dartsThrown;
    player2Darts += dartsThrown + Math.floor(Math.random() * 3) - 1;
  }

  const winnerId = player1Sets > player2Sets ? match.player1_id! : match.player2_id!;
  const loserId = player1Sets > player2Sets ? match.player2_id! : match.player1_id!;

  return {
    winnerId,
    loserId,
    player1Sets,
    player2Sets,
    player1TotalScore,
    player1Darts,
    player2TotalScore,
    player2Darts,
  };
}

async function updatePlayerStats(
  playerId: string,
  isWinner: boolean,
  setsWon: number,
  setsLost: number,
  dartsThrown: number,
  scoreThrown: number
) {
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) return;

  await supabase
    .from("players")
    .update({
      group_points: (player.group_points || 0) + (isWinner ? 2 : 0),
      group_sets_won: (player.group_sets_won || 0) + setsWon,
      group_sets_lost: (player.group_sets_lost || 0) + setsLost,
      total_darts: (player.total_darts || 0) + dartsThrown,
      total_score: (player.total_score || 0) + scoreThrown,
    })
    .eq("id", playerId);
}

export function useSimulateStageMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tournamentId,
      stage,
      gameMode,
    }: {
      tournamentId: string;
      stage: "group" | "league";
      gameMode: number;
    }) => {
      // Get all pending matches for this stage
      const { data: pendingMatches, error } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("stage", stage)
        .eq("status", "pending");

      if (error) throw error;
      if (!pendingMatches || pendingMatches.length === 0) {
        return { simulatedCount: 0 };
      }

      let simulatedCount = 0;

      // Simulate each match
      for (const match of pendingMatches) {
        if (!match.player1_id || !match.player2_id) continue;

        const setsToWin = match.sets_to_win || 2;
        const result = simulateSingleMatch(match as Match, gameMode, setsToWin);

        // Update the match
        await supabase
          .from("matches")
          .update({
            winner_id: result.winnerId,
            player1_sets: result.player1Sets,
            player2_sets: result.player2Sets,
            player1_total_score: result.player1TotalScore,
            player1_darts: result.player1Darts,
            player2_total_score: result.player2TotalScore,
            player2_darts: result.player2Darts,
            status: "completed",
          })
          .eq("id", match.id);

        // Update winner stats
        const winnerSets = match.player1_id === result.winnerId ? result.player1Sets : result.player2Sets;
        const winnerLostSets = match.player1_id === result.winnerId ? result.player2Sets : result.player1Sets;
        const winnerDarts = match.player1_id === result.winnerId ? result.player1Darts : result.player2Darts;
        const winnerScore = match.player1_id === result.winnerId ? result.player1TotalScore : result.player2TotalScore;

        await updatePlayerStats(
          result.winnerId,
          true,
          winnerSets,
          winnerLostSets,
          winnerDarts,
          winnerScore
        );

        // Update loser stats
        const loserSets = match.player1_id === result.loserId ? result.player1Sets : result.player2Sets;
        const loserLostSets = match.player1_id === result.loserId ? result.player2Sets : result.player1Sets;
        const loserDarts = match.player1_id === result.loserId ? result.player1Darts : result.player2Darts;
        const loserScore = match.player1_id === result.loserId ? result.player1TotalScore : result.player2TotalScore;

        await updatePlayerStats(
          result.loserId,
          false,
          loserSets,
          loserLostSets,
          loserDarts,
          loserScore
        );

        simulatedCount++;
      }

      // Check if stage is now complete and trigger knockout if needed
      const { data: allStageMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .in("stage", ["group", "league"]);

      const allDone = allStageMatches?.every(m => m.status === "completed" || m.status === "skipped");

      if (allDone && allStageMatches && allStageMatches.length > 0) {
        // Trigger knockout phase initialization
        const isLeague = allStageMatches[0].stage === "league";
        await startKnockoutPhase(tournamentId, isLeague);
      }

      return { simulatedCount };
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
  return 2;
}

async function startKnockoutPhase(tournamentId: string, isLeague: boolean) {
  // Import bracket generator dynamically to avoid circular deps
  const { generateBracket } = await import("@/lib/bracketGenerator");

  // Get tournament settings
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("knockout_sets_to_win")
    .eq("id", tournamentId)
    .single();

  const knockoutSetsToWin = tournament?.knockout_sets_to_win ?? 3;

  // Get all players
  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("tournament_id", tournamentId);

  if (!players) return;

  // Sort all players by performance
  const allPlayersSorted = [...players]
    .filter(p => p.group_name)
    .sort((a, b) => {
      if (b.group_points !== a.group_points) {
        return b.group_points - a.group_points;
      }
      const aSetDiff = (a.group_sets_won || 0) - (a.group_sets_lost || 0);
      const bSetDiff = (b.group_sets_won || 0) - (b.group_sets_lost || 0);
      if (bSetDiff !== aSetDiff) {
        return bSetDiff - aSetDiff;
      }
      const aAvg = calculatePlayerAvg(a.total_score || 0, a.total_darts || 0);
      const bAvg = calculatePlayerAvg(b.total_score || 0, b.total_darts || 0);
      return bAvg - aAvg;
    });

  const totalPlayers = allPlayersSorted.length;
  const targetAdvancing = getValidKnockoutSize(totalPlayers);
  
  const advancingPlayerIds = allPlayersSorted.slice(0, targetAdvancing).map(p => p.id);
  const eliminatedIds = allPlayersSorted.slice(targetAdvancing).map(p => p.id);

  // Mark eliminated players
  for (const id of eliminatedIds) {
    await supabase
      .from("players")
      .update({ is_eliminated: true })
      .eq("id", id);
  }

  // Get advancing players
  const { data: advancingPlayers } = await supabase
    .from("players")
    .select("*")
    .in("id", advancingPlayerIds);

  if (!advancingPlayers || advancingPlayers.length < 2) return;

  // Sort advancing players by their ranking
  const advancingPlayersSorted = [...advancingPlayers].sort((a, b) => {
    const aIndex = advancingPlayerIds.indexOf(a.id);
    const bIndex = advancingPlayerIds.indexOf(b.id);
    return aIndex - bIndex;
  });

  const bracket = generateBracket(
    advancingPlayersSorted.map((p, index) => ({ 
      id: p.id, 
      name: p.name, 
      seed: index + 1
    }))
  );

  // Create knockout matches
  const knockoutMatchesToInsert = bracket.map((match) => ({
    tournament_id: tournamentId,
    round: match.round,
    match_number: match.matchNumber,
    player1_id: match.player1Id || null,
    player2_id: match.player2Id || null,
    stage: "knockout",
    sets_to_win: knockoutSetsToWin,
  }));

  await supabase
    .from("matches")
    .insert(knockoutMatchesToInsert);

  // Update tournament phase
  await supabase
    .from("tournaments")
    .update({ 
      current_phase: "knockout",
      status: "active"
    })
    .eq("id", tournamentId);
}
