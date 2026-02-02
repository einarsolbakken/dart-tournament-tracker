export interface PlayerForLeague {
  id: string;
  name: string;
  seed?: number;
}

export interface LeagueMatch {
  matchNumber: number;
  player1Id: string;
  player2Id: string;
}

export interface LeagueConfig {
  playerCount: number;
  matchesPerPlayer: number;
  totalMatches: number;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Calculate valid matches per player options for a given player count
 * Requirements:
 * - K < N (no rematches needed)
 * - N × K must be even (so total matches is a whole number)
 */
export function getValidMatchesPerPlayerOptions(playerCount: number): number[] {
  const options: number[] = [];
  for (let k = 1; k < playerCount; k++) {
    // N × K must be even
    if ((playerCount * k) % 2 === 0) {
      options.push(k);
    }
  }
  return options;
}

/**
 * Calculate the default matches per player for a given player count
 * Tries to find a reasonable default (around half of possible matches)
 */
export function getDefaultMatchesPerPlayer(playerCount: number): number {
  const options = getValidMatchesPerPlayerOptions(playerCount);
  if (options.length === 0) return 1;
  
  // Pick something around the middle - not too few, not too many
  // For 6 players: options are [1,2,3,4,5] → pick 3
  // For 8 players: options are [1,3,5,7] or [2,4,6] depending on evenness → pick middle
  const middleIndex = Math.floor(options.length / 2);
  return options[middleIndex];
}

/**
 * Validate and calculate league configuration
 */
export function validateLeagueConfig(playerCount: number, matchesPerPlayer: number): LeagueConfig {
  // Check if N × K is even
  if ((playerCount * matchesPerPlayer) % 2 !== 0) {
    return {
      playerCount,
      matchesPerPlayer,
      totalMatches: 0,
      isValid: false,
      errorMessage: `${playerCount} spillere × ${matchesPerPlayer} kamper = ${playerCount * matchesPerPlayer} (må være partall)`,
    };
  }

  // Check if K < N
  if (matchesPerPlayer >= playerCount) {
    return {
      playerCount,
      matchesPerPlayer,
      totalMatches: 0,
      isValid: false,
      errorMessage: `Kamper per spiller (${matchesPerPlayer}) må være mindre enn antall spillere (${playerCount})`,
    };
  }

  const totalMatches = (playerCount * matchesPerPlayer) / 2;

  return {
    playerCount,
    matchesPerPlayer,
    totalMatches,
    isValid: true,
  };
}

/**
 * Generates league matches where all players play exactly K matches.
 * No player plays the same opponent more than once.
 * Uses a deterministic round-robin approach for guaranteed fairness.
 */
export function generateLeagueMatches(
  players: PlayerForLeague[],
  matchesPerPlayer: number
): LeagueMatch[] {
  const n = players.length;
  if (n < 2) return [];

  // Validate configuration
  const config = validateLeagueConfig(n, matchesPerPlayer);
  if (!config.isValid) {
    console.error("Invalid league configuration:", config.errorMessage);
    return [];
  }

  const matches: LeagueMatch[] = [];
  const matchCounts: Map<string, number> = new Map();
  const playedPairs: Set<string> = new Set();

  // Initialize match counts
  players.forEach(p => matchCounts.set(p.id, 0));

  // Use a deterministic approach based on round-robin principles
  // Generate matches round by round, ensuring each player gets one match per round when possible
  let matchNumber = 1;
  
  while (matches.length < config.totalMatches) {
    // Find players who still need matches, sorted by how many they still need (most needed first)
    const playersNeedingMatches = players
      .filter(p => (matchCounts.get(p.id) || 0) < matchesPerPlayer)
      .sort((a, b) => {
        const aNeeds = matchesPerPlayer - (matchCounts.get(a.id) || 0);
        const bNeeds = matchesPerPlayer - (matchCounts.get(b.id) || 0);
        return bNeeds - aNeeds; // Most needed first
      });

    if (playersNeedingMatches.length < 2) break;

    // Try to pair players who haven't played each other
    let matchMade = false;
    
    for (let i = 0; i < playersNeedingMatches.length && !matchMade; i++) {
      for (let j = i + 1; j < playersNeedingMatches.length && !matchMade; j++) {
        const p1 = playersNeedingMatches[i];
        const p2 = playersNeedingMatches[j];
        const pairKey = [p1.id, p2.id].sort().join("-");
        
        if (!playedPairs.has(pairKey)) {
          matches.push({
            matchNumber: matchNumber++,
            player1Id: p1.id,
            player2Id: p2.id,
          });
          matchCounts.set(p1.id, (matchCounts.get(p1.id) || 0) + 1);
          matchCounts.set(p2.id, (matchCounts.get(p2.id) || 0) + 1);
          playedPairs.add(pairKey);
          matchMade = true;
        }
      }
    }

    // If no match could be made, we have a configuration problem
    if (!matchMade) {
      console.error("Could not generate valid league schedule - configuration issue");
      break;
    }
  }

  // Verify all players got exactly K matches
  const playerMatchCounts = players.map(p => ({
    name: p.name,
    count: matchCounts.get(p.id) || 0
  }));
  
  const allPlayersHaveKMatches = playerMatchCounts.every(
    p => p.count === matchesPerPlayer
  );

  if (!allPlayersHaveKMatches) {
    console.error("Error: Not all players got exactly K matches:");
    playerMatchCounts.forEach(p => {
      if (p.count !== matchesPerPlayer) {
        console.error(`  ${p.name}: ${p.count} matches (expected ${matchesPerPlayer})`);
      }
    });
  }

  return matches;
}

/**
 * Calculate how many matches each player will play
 * This is now configurable, not calculated
 */
export function calculateMatchesPerPlayer(playerCount: number): number {
  // Default: use the middle option for backwards compatibility
  return getDefaultMatchesPerPlayer(playerCount);
}

/**
 * Calculate total number of matches in the league
 */
export function calculateTotalMatches(playerCount: number, matchesPerPlayer?: number): number {
  const k = matchesPerPlayer ?? calculateMatchesPerPlayer(playerCount);
  return (playerCount * k) / 2;
}

/**
 * Get valid knockout size for league format
 * Must be 16, 8, 4, or 2
 */
export function getLeagueKnockoutSize(playerCount: number): number {
  const validSizes = [16, 8, 4, 2];
  for (const size of validSizes) {
    if (playerCount >= size) {
      return size;
    }
  }
  return 2;
}
