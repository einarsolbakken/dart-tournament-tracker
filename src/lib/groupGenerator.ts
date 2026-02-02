export interface PlayerForGroup {
  id: string;
  name: string;
  seed?: number;
}

export interface GroupMatch {
  groupName: string;
  matchNumber: number;
  player1Id: string;
  player2Id: string;
}

export interface GroupInfo {
  name: string;
  playerIds: string[];
}

export function generateGroups(players: PlayerForGroup[]): GroupInfo[] {
  const n = players.length;
  
  // Determine number of groups - always aim for 8 advancing to knockout
  // With 4 groups and top 2 from each advancing = 8 players in knockout
  let numGroups: number;
  
  if (n <= 4) {
    numGroups = 1;
  } else if (n <= 8) {
    numGroups = 2;
  } else {
    // For 9+ players, use 4 groups with top 2 from each advancing
    numGroups = 4;
  }
  
  // Initialize groups
  const groups: GroupInfo[] = [];
  const groupNames = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  for (let i = 0; i < numGroups; i++) {
    groups.push({
      name: groupNames[i],
      playerIds: [],
    });
  }
  
  // Seed players (higher seed = better player = lower number)
  const seededPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  
  // Distribute players using snake draft for balanced groups
  // Round 1: A B C D, Round 2: D C B A, Round 3: A B C D, etc.
  for (let i = 0; i < seededPlayers.length; i++) {
    const round = Math.floor(i / numGroups);
    const posInRound = i % numGroups;
    
    // Snake: even rounds go forward (0,1,2,3), odd rounds go backward (3,2,1,0)
    const groupIdx = round % 2 === 0 ? posInRound : (numGroups - 1 - posInRound);
    groups[groupIdx].playerIds.push(seededPlayers[i].id);
  }
  
  return groups;
}

export function generateGroupMatches(groups: GroupInfo[]): GroupMatch[] {
  const matches: GroupMatch[] = [];
  
  for (const group of groups) {
    const players = group.playerIds;
    let matchNum = 1;
    
    // Round-robin: each player plays against every other player in the group once
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({
          groupName: group.name,
          matchNumber: matchNum++,
          player1Id: players[i],
          player2Id: players[j],
        });
      }
    }
    // No extra matches for 2-player groups - just single round-robin
  }
  
  return matches;
}

export function calculateAdvancingPlayers(groups: GroupInfo[], totalPlayers: number): number {
  // Always exactly 8 players advance to quarterfinals when > 8 players
  if (totalPlayers > 8) {
    return 8;
  }
  
  // For 8 or fewer, all advance (no group stage really needed)
  return totalPlayers;
}

export function willHaveEvenAdvancing(playerCount: number): boolean {
  // Always true now since we always have 8 advancing (or fewer if < 8 players)
  return true;
}

export function getMinPlayersForEvenAdvance(minPlayers: number): number {
  // Find the minimum number of players >= minPlayers that gives even number advancing
  for (let n = minPlayers; n <= minPlayers + 10; n++) {
    if (willHaveEvenAdvancing(n)) {
      return n;
    }
  }
  return minPlayers;
}
