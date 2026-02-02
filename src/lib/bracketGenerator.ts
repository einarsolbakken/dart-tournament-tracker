export interface Player {
  id: string;
  name: string;
  seed?: number;
}

export interface Match {
  round: number;
  matchNumber: number;
  player1Id: string | null;
  player2Id: string | null;
}

export function generateBracket(players: Player[]): Match[] {
  const n = players.length;
  
  // Find next power of 2
  let bracketSize = 1;
  while (bracketSize < n) {
    bracketSize *= 2;
  }
  
  const totalRounds = Math.log2(bracketSize);
  const matches: Match[] = [];
  
  // Seed players (or sort by seed if provided)
  const seededPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  
  // Add byes if needed (null = bye)
  const byes = bracketSize - n;
  const paddedPlayers: (Player | null)[] = [...seededPlayers];
  for (let i = 0; i < byes; i++) {
    paddedPlayers.push(null);
  }
  
  // Create proper bracket seeding: 1v8, 4v5, 3v6, 2v7 (for 8 players)
  // This ensures that 1 and 2 can only meet in final, 1-4 in semis, etc.
  const bracketOrder = getBracketSeeding(bracketSize);
  const orderedPlayers: (Player | null)[] = new Array(bracketSize).fill(null);
  
  for (let i = 0; i < paddedPlayers.length; i++) {
    orderedPlayers[bracketOrder[i]] = paddedPlayers[i];
  }
  
  // Generate first round matches
  const firstRoundMatches = bracketSize / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    const player1 = orderedPlayers[i * 2];
    const player2 = orderedPlayers[i * 2 + 1];
    
    matches.push({
      round: 1,
      matchNumber: i + 1,
      player1Id: player1?.id || null,
      player2Id: player2?.id || null,
    });
  }
  
  // Generate subsequent round matches (empty, to be filled as tournament progresses)
  let matchesInRound = firstRoundMatches / 2;
  for (let round = 2; round <= totalRounds; round++) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        round,
        matchNumber: i + 1,
        player1Id: null,
        player2Id: null,
      });
    }
    matchesInRound /= 2;
  }
  
  return matches;
}

// Standard tournament bracket seeding
// For 8 players: creates matchups 1v8, 4v5, 3v6, 2v7
// This ensures seeds 1&2 can only meet in final, 1-4 in semis
function getBracketSeeding(size: number): number[] {
  if (size === 2) return [0, 1];
  
  const result: number[] = [];
  
  // Build seeding recursively
  // For each half, we need the bracket seeding of that half
  const half = size / 2;
  const halfSeeding = getBracketSeeding(half);
  
  // Pair seed i with seed (size - 1 - i) for proper bracket matchups
  for (let i = 0; i < half; i++) {
    // Top half position
    result.push(halfSeeding[i] * 2);
    // Bottom half position (mirror)
    result.push(size - 1 - halfSeeding[i] * 2);
  }
  
  return result;
}

export function getTotalRounds(playerCount: number): number {
  let bracketSize = 1;
  while (bracketSize < playerCount) {
    bracketSize *= 2;
  }
  return Math.log2(bracketSize);
}
