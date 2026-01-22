/**
 * Dead Rubber Detection
 * 
 * Determines if a match outcome will affect who advances to the knockout stage.
 * A "dead rubber" match is one where the result doesn't change the standings
 * enough to affect which players qualify.
 */

interface PlayerStanding {
  id: string;
  points: number;
  setsWon: number;
  setsLost: number;
  totalScore: number;
  totalDarts: number;
}

interface MatchInfo {
  id: string;
  player1Id: string;
  player2Id: string;
  status: string;
  setsToWin: number;
}

/**
 * Calculate the points difference needed to overtake another player
 */
function getPointsToOvertake(
  challenger: PlayerStanding,
  target: PlayerStanding,
  setsToWin: number
): { possible: boolean; requiresMaxWin: boolean } {
  const pointsPerWin = setsToWin; // Points = sets won in the match
  const currentDiff = target.points - challenger.points;
  
  // If challenger wins, they get setsToWin points
  // Maximum possible swing: challenger gains setsToWin, target gains 0
  const maxSwing = pointsPerWin;
  
  if (currentDiff > maxSwing) {
    return { possible: false, requiresMaxWin: false };
  }
  
  // If equal after points, check set difference
  if (currentDiff === maxSwing) {
    // Would be tied on points, check set difference
    const challengerSetDiff = challenger.setsWon - challenger.setsLost;
    const targetSetDiff = target.setsWon - target.setsLost;
    
    // If challenger wins setsToWin-0, they gain setsToWin to their setDiff
    // and it doesn't affect target's setDiff (assuming they don't play each other in this match)
    const potentialNewSetDiff = challengerSetDiff + setsToWin;
    
    if (potentialNewSetDiff <= targetSetDiff) {
      return { possible: false, requiresMaxWin: false };
    }
  }
  
  return { possible: true, requiresMaxWin: currentDiff === maxSwing };
}

/**
 * Check if a match is a "dead rubber" - one where the outcome doesn't affect advancement
 */
export function isDeadRubberMatch(
  match: MatchInfo,
  allPlayers: PlayerStanding[],
  pendingMatches: MatchInfo[],
  knockoutSize: number
): { isDeadRubber: boolean; reason: string } {
  const player1 = allPlayers.find(p => p.id === match.player1Id);
  const player2 = allPlayers.find(p => p.id === match.player2Id);
  
  if (!player1 || !player2) {
    return { isDeadRubber: false, reason: "" };
  }
  
  // Sort players by standing
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    const aAvg = a.totalDarts > 0 ? (a.totalScore / a.totalDarts) * 3 : 0;
    const bAvg = b.totalDarts > 0 ? (b.totalScore / b.totalDarts) * 3 : 0;
    return bAvg - aAvg;
  });
  
  const player1Rank = sortedPlayers.findIndex(p => p.id === player1.id) + 1;
  const player2Rank = sortedPlayers.findIndex(p => p.id === player2.id) + 1;
  
  // Count how many other pending matches each player has (excluding this match)
  const player1OtherMatches = pendingMatches.filter(
    m => m.id !== match.id && (m.player1Id === player1.id || m.player2Id === player1.id)
  ).length;
  const player2OtherMatches = pendingMatches.filter(
    m => m.id !== match.id && (m.player1Id === player2.id || m.player2Id === player2.id)
  ).length;
  
  // If either player has other matches, this match might affect future standings indirectly
  // Be more conservative - only mark as dead rubber if this is the last match for both
  if (player1OtherMatches > 0 || player2OtherMatches > 0) {
    return { isDeadRubber: false, reason: "" };
  }
  
  const setsToWin = match.setsToWin;
  
  // Case 1: Both players are already safely qualified (can't drop out of top knockoutSize)
  const bothQualified = player1Rank <= knockoutSize && player2Rank <= knockoutSize;
  
  // Check if result could cause either to drop out
  if (bothQualified) {
    // Check if loser could be overtaken by someone outside qualification
    const playersJustOutside = sortedPlayers.slice(knockoutSize, knockoutSize + 2);
    
    let couldAffectPlayer1 = false;
    let couldAffectPlayer2 = false;
    
    for (const outsider of playersJustOutside) {
      // Check if outsider has pending matches that could let them overtake
      const outsiderMatches = pendingMatches.filter(
        m => m.player1Id === outsider.id || m.player2Id === outsider.id
      );
      
      if (outsiderMatches.length > 0) {
        // Outsider could still gain points
        const maxPointsGain = outsiderMatches.length * setsToWin;
        
        // If player1 loses this match and outsider wins all their matches
        const player1AfterLoss = { ...player1, points: player1.points }; // No points for loss
        const outsiderAfterWins = { ...outsider, points: outsider.points + maxPointsGain };
        
        if (outsiderAfterWins.points > player1AfterLoss.points) {
          couldAffectPlayer1 = true;
        }
        
        // Same for player2
        const player2AfterLoss = { ...player2, points: player2.points };
        if (outsiderAfterWins.points > player2AfterLoss.points) {
          couldAffectPlayer2 = true;
        }
      }
    }
    
    if (!couldAffectPlayer1 && !couldAffectPlayer2) {
      return {
        isDeadRubber: true,
        reason: `Begge spillerne er allerede kvalifisert til sluttspillet`
      };
    }
  }
  
  // Case 2: Both players are eliminated (can't reach top knockoutSize)
  const player1MaxPoints = player1.points + setsToWin;
  const player2MaxPoints = player2.points + setsToWin;
  
  const lastQualifyingPlayer = sortedPlayers[knockoutSize - 1];
  
  // Check if player could possibly catch up even with a win
  const player1CanQualify = player1MaxPoints >= lastQualifyingPlayer.points;
  const player2CanQualify = player2MaxPoints >= lastQualifyingPlayer.points;
  
  if (!player1CanQualify && !player2CanQualify) {
    return {
      isDeadRubber: true,
      reason: `Begge spillerne er allerede eliminert fra sluttspillet`
    };
  }
  
  // Case 3: One is safely qualified and one is safely eliminated
  // (The match doesn't change either outcome)
  const player1SafelyQualified = player1Rank <= knockoutSize && 
    (player1.points > sortedPlayers[knockoutSize]?.points + setsToWin || knockoutSize >= allPlayers.length);
  const player2SafelyQualified = player2Rank <= knockoutSize && 
    (player2.points > sortedPlayers[knockoutSize]?.points + setsToWin || knockoutSize >= allPlayers.length);
  
  if ((player1SafelyQualified && !player2CanQualify) || (player2SafelyQualified && !player1CanQualify)) {
    return {
      isDeadRubber: true,
      reason: `Resultatet påvirker ikke hvem som går videre`
    };
  }
  
  return { isDeadRubber: false, reason: "" };
}

/**
 * Get knockout size for a player count
 */
export function getKnockoutSize(playerCount: number): number {
  const validSizes = [16, 8, 4, 2];
  for (const size of validSizes) {
    if (playerCount >= size) return size;
  }
  return 2;
}
