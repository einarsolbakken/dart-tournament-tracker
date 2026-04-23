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
 * Uses randomized player order + fair matching for random but balanced schedules.
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

  // Try multiple times with different random seeds; greedy can deadlock
  const MAX_ATTEMPTS = 200;
  let bestMatches: LeagueMatch[] | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    const matches: LeagueMatch[] = [];
    const matchCounts: Map<string, number> = new Map();
    const playedPairs: Set<string> = new Set();
    shuffledPlayers.forEach(p => matchCounts.set(p.id, 0));

    let matchNumber = 1;
    let failed = false;

    while (matches.length < config.totalMatches) {
      const playersNeedingMatches = shuffledPlayers
        .filter(p => (matchCounts.get(p.id) || 0) < matchesPerPlayer)
        .map(p => ({ player: p, needs: matchesPerPlayer - (matchCounts.get(p.id) || 0), rand: Math.random() }))
        .sort((a, b) => {
          if (b.needs !== a.needs) return b.needs - a.needs;
          return a.rand - b.rand;
        })
        .map(x => x.player);

      if (playersNeedingMatches.length < 2) {
        failed = true;
        break;
      }

      let matchMade = false;
      for (let i = 0; i < playersNeedingMatches.length && !matchMade; i++) {
        for (let j = i + 1; j < playersNeedingMatches.length && !matchMade; j++) {
          const p1 = playersNeedingMatches[i];
          const p2 = playersNeedingMatches[j];
          const pairKey = [p1.id, p2.id].sort().join("-");
          if (!playedPairs.has(pairKey)) {
            matches.push({ matchNumber: matchNumber++, player1Id: p1.id, player2Id: p2.id });
            matchCounts.set(p1.id, (matchCounts.get(p1.id) || 0) + 1);
            matchCounts.set(p2.id, (matchCounts.get(p2.id) || 0) + 1);
            playedPairs.add(pairKey);
            matchMade = true;
          }
        }
      }

      if (!matchMade) {
        failed = true;
        break;
      }
    }

    if (!failed && matches.length === config.totalMatches) {
      const allOk = players.every(p => (matchCounts.get(p.id) || 0) === matchesPerPlayer);
      if (allOk) {
        bestMatches = matches;
        break;
      }
    }
  }

  if (!bestMatches) {
    console.error("Could not generate valid league schedule after retries; falling back to circle method");
    return generateCircleMethodMatches(players, matchesPerPlayer);
  }

  return bestMatches;
}

/**
 * Deterministic round-robin (circle method) fallback.
 * Generates a full round-robin and takes the first K rounds worth of matches.
 */
function generateCircleMethodMatches(
  players: PlayerForLeague[],
  matchesPerPlayer: number
): LeagueMatch[] {
  const n = players.length;
  // Shuffle for randomness
  const arr = [...players];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Add a bye if odd
  const isOdd = n % 2 === 1;
  const list: (PlayerForLeague | null)[] = isOdd ? [...arr, null] : [...arr];
  const size = list.length;
  const rounds = size - 1;

  const allRounds: LeagueMatch[][] = [];
  let matchNumber = 1;

  for (let r = 0; r < rounds; r++) {
    const roundMatches: LeagueMatch[] = [];
    for (let i = 0; i < size / 2; i++) {
      const p1 = list[i];
      const p2 = list[size - 1 - i];
      if (p1 && p2) {
        roundMatches.push({ matchNumber: matchNumber++, player1Id: p1.id, player2Id: p2.id });
      }
    }
    allRounds.push(roundMatches);
    // Rotate (keep first fixed)
    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop()!);
    list.splice(0, list.length, fixed, ...rest);
  }

  // Take rounds until each player has K matches
  const matches: LeagueMatch[] = [];
  const counts = new Map<string, number>();
  players.forEach(p => counts.set(p.id, 0));

  for (const round of allRounds) {
    if (players.every(p => (counts.get(p.id) || 0) >= matchesPerPlayer)) break;
    for (const m of round) {
      const c1 = counts.get(m.player1Id) || 0;
      const c2 = counts.get(m.player2Id) || 0;
      if (c1 < matchesPerPlayer && c2 < matchesPerPlayer) {
        matches.push({ ...m, matchNumber: matches.length + 1 });
        counts.set(m.player1Id, c1 + 1);
        counts.set(m.player2Id, c2 + 1);
      }
    }
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
