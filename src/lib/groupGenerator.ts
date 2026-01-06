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
  
  // Calculate number of groups (max 4 per group, min 3)
  const numGroups = Math.ceil(n / 4);
  
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
  }
  
  return matches;
}

export function calculateAdvancingPlayers(groups: GroupInfo[]): number {
  // From each group, last place is eliminated
  // So (group_size - 1) players advance from each group
  let totalAdvancing = 0;
  
  for (const group of groups) {
    totalAdvancing += group.playerIds.length - 1;
  }
  
  return totalAdvancing;
}

export function willHaveEvenAdvancing(playerCount: number): boolean {
  const testPlayers = Array.from({ length: playerCount }, (_, i) => ({
    id: `test-${i}`,
    name: `Player ${i}`,
  }));
  
  const groups = generateGroups(testPlayers);
  const advancing = calculateAdvancingPlayers(groups);
  
  return advancing % 2 === 0;
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
