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
  
  // If 8 or fewer players, no group stage needed - go straight to knockout
  // This is handled at tournament creation level
  
  // For more than 8 players, we need exactly 8 to advance to quarterfinals
  // Calculate optimal group structure
  let numGroups: number;
  let targetAdvancing = 8;
  
  if (n <= 8) {
    // 8 or fewer - straight to knockout (should not reach here for group stage)
    numGroups = Math.ceil(n / 4);
  } else if (n <= 12) {
    // 9-12 players: 4 groups, need to eliminate (n - 8) players
    // With 4 groups of 3 each (12 players), eliminating 4 leaves 8
    numGroups = 4;
  } else if (n <= 16) {
    // 13-16 players: 4 groups of 4, eliminate 2 per group = 8 advance
    numGroups = 4;
  } else {
    // More than 16: still aim for 8 advancing
    numGroups = Math.ceil(n / 4);
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
  
  // Seed players (or shuffle if no seeds)
  const seededPlayers = [...players].sort((a, b) => (a.seed || 999) - (b.seed || 999));
  
  // Distribute players in snake draft pattern for balanced groups
  // E.g., with 3 groups: 1->A, 2->B, 3->C, 4->C, 5->B, 6->A, 7->A, 8->B, 9->C...
  let direction = 1;
  let groupIndex = 0;
  
  for (const player of seededPlayers) {
    groups[groupIndex].playerIds.push(player.id);
    
    // Move to next group
    groupIndex += direction;
    
    // Reverse direction at ends
    if (groupIndex >= numGroups) {
      groupIndex = numGroups - 1;
      direction = -1;
    } else if (groupIndex < 0) {
      groupIndex = 0;
      direction = 1;
    }
  }
  
  return groups;
}

export function generateGroupMatches(groups: GroupInfo[]): GroupMatch[] {
  const matches: GroupMatch[] = [];
  
  for (const group of groups) {
    const players = group.playerIds;
    let matchNum = 1;
    
    // Round-robin: each player plays against every other player in the group
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
    
    // If only 2 players in group, add a second match between them
    if (players.length === 2) {
      matches.push({
        groupName: group.name,
        matchNumber: matchNum++,
        player1Id: players[1], // Swap order for variety
        player2Id: players[0],
      });
    }
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
