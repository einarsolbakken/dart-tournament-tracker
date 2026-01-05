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
  
  // Seed players (or shuffle if no seeds)
  const seededPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  
  // Add byes if needed
  const byes = bracketSize - n;
  const paddedPlayers: (Player | null)[] = [...seededPlayers];
  for (let i = 0; i < byes; i++) {
    paddedPlayers.push(null);
  }
  
  // Standard seeding placement for bracket
  const seededOrder = getSeededOrder(bracketSize);
  const orderedPlayers: (Player | null)[] = new Array(bracketSize).fill(null);
  seededOrder.forEach((position, index) => {
    if (index < paddedPlayers.length) {
      orderedPlayers[position] = paddedPlayers[index];
    }
  });
  
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

function getSeededOrder(size: number): number[] {
  if (size === 2) return [0, 1];
  
  const smaller = getSeededOrder(size / 2);
  const result: number[] = [];
  
  for (const pos of smaller) {
    result.push(pos);
    result.push(size - 1 - pos);
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
