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

/**
 * Generates round-robin matches for a league system where all players
 * play an equal number of matches. We try to balance so everyone plays
 * as similar number of games as possible.
 */
export function generateLeagueMatches(players: PlayerForLeague[]): LeagueMatch[] {
  const n = players.length;
  if (n < 2) return [];

  const matches: LeagueMatch[] = [];
  let matchNumber = 1;

  // Full round-robin: each player plays every other player once
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        matchNumber: matchNumber++,
        player1Id: players[i].id,
        player2Id: players[j].id,
      });
    }
  }

  return matches;
}

/**
 * Calculate how many matches each player will play in the league
 */
export function calculateMatchesPerPlayer(playerCount: number): number {
  // In round-robin, each player plays against every other player
  return playerCount - 1;
}

/**
 * Calculate total number of matches in the league
 */
export function calculateTotalMatches(playerCount: number): number {
  // n * (n-1) / 2 matches total
  return (playerCount * (playerCount - 1)) / 2;
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
