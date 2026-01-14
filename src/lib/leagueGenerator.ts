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
 * Uses a greedy algorithm with randomization to distribute matches fairly.
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

  // Generate all possible unique pairs
  const allPairs: [string, string][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      allPairs.push([players[i].id, players[j].id]);
    }
  }

  // Shuffle pairs for randomization
  for (let i = allPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPairs[i], allPairs[j]] = [allPairs[j], allPairs[i]];
  }

  // Greedy selection: pick matches where both players have fewer than K matches
  let matchNumber = 1;
  for (const [p1, p2] of allPairs) {
    const p1Count = matchCounts.get(p1) || 0;
    const p2Count = matchCounts.get(p2) || 0;

    if (p1Count < matchesPerPlayer && p2Count < matchesPerPlayer) {
      const pairKey = [p1, p2].sort().join("-");
      if (!playedPairs.has(pairKey)) {
        matches.push({
          matchNumber: matchNumber++,
          player1Id: p1,
          player2Id: p2,
        });
        matchCounts.set(p1, p1Count + 1);
        matchCounts.set(p2, p2Count + 1);
        playedPairs.add(pairKey);
      }
    }

    // Check if we've generated enough matches
    if (matches.length >= config.totalMatches) {
      break;
    }
  }

  // Verify all players got exactly K matches
  const allPlayersHaveKMatches = Array.from(matchCounts.values()).every(
    count => count === matchesPerPlayer
  );

  if (!allPlayersHaveKMatches) {
    console.warn("Warning: Not all players got exactly K matches. This configuration might be problematic.");
    // Log which players have issues
    players.forEach(p => {
      const count = matchCounts.get(p.id) || 0;
      if (count !== matchesPerPlayer) {
        console.warn(`Player ${p.name} has ${count} matches instead of ${matchesPerPlayer}`);
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
