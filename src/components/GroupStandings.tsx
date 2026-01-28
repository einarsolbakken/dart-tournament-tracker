import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, SkipForward } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { getCountryFlag, getCountryGradient } from "./CountryFlagPicker";
import { isDeadRubberMatch, getKnockoutSize } from "@/lib/deadRubberDetection";

interface Player {
  id: string;
  name: string;
  group_name: string | null;
  group_points: number;
  group_sets_won: number;
  group_sets_lost: number;
  total_darts: number;
  total_score: number;
  is_eliminated: boolean;
  country?: string | null;
}

interface Match {
  id: string;
  group_name: string | null;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_sets: number;
  player2_sets: number;
  player1_total_score: number;
  player1_darts: number;
  player2_total_score: number;
  player2_darts: number;
  status: string;
  stage: string;
  sets_to_win?: number;
}

interface GroupStandingsProps {
  players: Player[];
  matches: Match[];
  onMatchClick: (match: Match) => void;
  onEditMatch?: (match: Match) => void;
  onSkipMatch?: (match: Match) => void;
}

// Calculate dart average: (total score / total darts) * 3
function calculateAvg(totalScore: number, totalDarts: number): string {
  if (totalDarts === 0) return "-";
  const avg = (totalScore / totalDarts) * 3;
  return avg.toFixed(1);
}

// Threshold for showing tooltip on names (characters)
const NAME_TRUNCATE_THRESHOLD = 12;

export function GroupStandings({ players, matches, onMatchClick, onEditMatch, onSkipMatch }: GroupStandingsProps) {
  // Get unique group names
  const groupNames = [...new Set(players.map(p => p.group_name).filter(Boolean))].sort() as string[];
  
  // Check if all group matches are completed or skipped
  const allGroupMatches = matches.filter(m => m.stage === "group");
  const allGroupMatchesCompleted = allGroupMatches.length > 0 && allGroupMatches.every(m => m.status === "completed" || m.status === "skipped");

  // Calculate knockout size for dead rubber detection
  const knockoutSize = getKnockoutSize(players.length);
  
  // Number of players that advance from each group (always top 2)
  const advancingPerGroup = 2;
  
  // Helper to get wins for a player
  const completedGroupMatches = matches.filter(m => m.stage === "group" && m.status === "completed");
  const getPlayerWins = (playerId: string) => {
    return completedGroupMatches.filter(m => m.winner_id === playerId).length;
  };

  // For each group, determine who advances (top 2 from each group)
  const advancingPlayerIds = new Set<string>();
  
  if (allGroupMatchesCompleted) {
    groupNames.forEach(groupName => {
      const groupPlayers = players
        .filter(p => p.group_name === groupName)
        .sort((a, b) => {
          // 1. Sort by wins first
          const aWins = getPlayerWins(a.id);
          const bWins = getPlayerWins(b.id);
          if (bWins !== aWins) {
            return bWins - aWins;
          }
          // 2. Then by average as tiebreaker
          const aAvg = a.total_darts > 0 ? (a.total_score / a.total_darts) * 3 : 0;
          const bAvg = b.total_darts > 0 ? (b.total_score / b.total_darts) * 3 : 0;
          return bAvg - aAvg;
        });
      
      // Top 2 from this group advance
      groupPlayers.slice(0, advancingPerGroup).forEach(p => advancingPlayerIds.add(p.id));
    });
  }

  // Prepare player standings for dead rubber detection
  const playerStandings = players.map(p => ({
    id: p.id,
    points: p.group_points || 0,
    setsWon: p.group_sets_won || 0,
    setsLost: p.group_sets_lost || 0,
    totalScore: p.total_score || 0,
    totalDarts: p.total_darts || 0,
  }));

  // Get all pending matches for dead rubber detection
  const allPendingMatches = allGroupMatches.filter(m => m.status === "pending").map(m => ({
    id: m.id,
    player1Id: m.player1_id || "",
    player2Id: m.player2_id || "",
    status: m.status,
    setsToWin: m.sets_to_win || 2,
  }));
  
  return (
    <TooltipProvider delayDuration={100}>
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupNames.map(groupName => {
          // Get group matches to calculate actual wins
          const groupMatchesForSort = matches.filter(m => m.group_name === groupName && m.status === "completed");
          
          const getPlayerWins = (playerId: string) => {
            return groupMatchesForSort.filter(m => m.winner_id === playerId).length;
          };
          
          const groupPlayers = players
            .filter(p => p.group_name === groupName)
            .sort((a, b) => {
              // 1. Sort by wins first (most wins = highest rank)
              const aWins = getPlayerWins(a.id);
              const bWins = getPlayerWins(b.id);
              if (bWins !== aWins) {
                return bWins - aWins;
              }
              // 2. Then by average (higher is better) as tiebreaker
              const aAvg = a.total_darts > 0 ? (a.total_score / a.total_darts) * 3 : 0;
              const bAvg = b.total_darts > 0 ? (b.total_score / b.total_darts) * 3 : 0;
              return bAvg - aAvg;
            });
          
          const groupMatches = matches.filter(m => m.group_name === groupName && m.stage === "group");
          const completedMatches = groupMatches.filter(m => m.status === "completed").length;
          const totalMatches = groupMatches.length;
          
          return (
            <Card key={groupName} className="overflow-hidden">
              <CardHeader className="bg-primary/10 py-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="font-display text-xl">Gruppe {groupName}</span>
                  <Badge variant="outline">
                    {completedMatches}/{totalMatches} kamper
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">Spiller</th>
                      <th className="text-center py-2 px-1">K</th>
                      <th className="text-center py-2 px-1">V</th>
                      <th className="text-center py-2 px-1">T</th>
                      <th className="text-center py-2 px-3">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupPlayers.map((player, index) => {
                      const playerMatches = matches.filter(
                        m => m.group_name === groupName && 
                        m.status === "completed" && 
                        (m.player1_id === player.id || m.player2_id === player.id)
                      );
                      const matchesPlayed = playerMatches.length;
                      const wins = playerMatches.filter(m => m.winner_id === player.id).length;
                      const losses = matchesPlayed - wins;
                      
                      // Calculate average per 3 darts using real data
                      const avgDisplay = calculateAvg(player.total_score || 0, player.total_darts || 0);
                      const countryGradient = player.country ? getCountryGradient(player.country) : undefined;
                      const countryFlag = player.country ? getCountryFlag(player.country) : "";
                      
                      // Check if this player is eliminated (doesn't advance)
                      const isEliminated = allGroupMatchesCompleted && !advancingPlayerIds.has(player.id);
                      
                      return (
                        <tr 
                          key={player.id}
                          className={cn(
                            "border-b border-border/50 last:border-0",
                            isEliminated && "bg-destructive/10"
                          )}
                          style={countryGradient && !isEliminated ? { background: countryGradient } : undefined}
                        >
                          <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                          <td className="py-2 px-3 font-medium">
                            {player.name.length > NAME_TRUNCATE_THRESHOLD ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={cn(
                                    "flex items-center gap-2 max-w-[140px]",
                                    isEliminated && "text-muted-foreground"
                                  )}>
                                    {countryFlag && <span className="text-sm shrink-0">{countryFlag}</span>}
                                    <span className="truncate">{player.name}</span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{player.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className={cn(
                                "flex items-center gap-2 max-w-[140px]",
                                isEliminated && "text-muted-foreground"
                              )}>
                                {countryFlag && <span className="text-sm shrink-0">{countryFlag}</span>}
                                <span className="truncate">{player.name}</span>
                              </span>
                            )}
                          </td>
                          <td className="text-center py-2 px-1 font-bold">{matchesPlayed}</td>
                          <td className={cn("text-center py-2 px-1", isEliminated ? "text-muted-foreground" : "text-green-500")}>{wins}</td>
                          <td className={cn("text-center py-2 px-1", isEliminated ? "text-muted-foreground" : "text-destructive")}>{losses}</td>
                          <td className={cn("text-center py-2 px-3 text-xs font-medium", isEliminated && "text-muted-foreground")}>
                            {avgDisplay}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Group Matches */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-display text-2xl">
            {allGroupMatchesCompleted ? "Resultater fra alle gruppekamper" : "Gruppekamper"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {allGroupMatchesCompleted 
              ? "Trykk på kampen om noen resultater må endres" 
              : "Trykk på en kamp for å starte"}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupNames.map(groupName => {
            const groupMatches = matches.filter(m => m.group_name === groupName && m.stage === "group");
            
            return (
              <Card key={groupName}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">Gruppe {groupName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupMatches.map(match => {
                    const player1 = players.find(p => p.id === match.player1_id);
                    const player2 = players.find(p => p.id === match.player2_id);
                    const isCompleted = match.status === "completed";
                    const isSkipped = match.status === "skipped";
                    const isPending = match.status === "pending";
                    const canPlay = match.player1_id && match.player2_id && isPending;
                    
                    // Calculate match avg for each player when completed
                    const player1MatchAvg = isCompleted ? calculateAvg(match.player1_total_score || 0, match.player1_darts || 0) : null;
                    const player2MatchAvg = isCompleted ? calculateAvg(match.player2_total_score || 0, match.player2_darts || 0) : null;
                    
                    // Check if this match is a dead rubber (only for pending matches)
                    const deadRubberInfo = isPending ? isDeadRubberMatch(
                      {
                        id: match.id,
                        player1Id: match.player1_id || "",
                        player2Id: match.player2_id || "",
                        status: match.status,
                        setsToWin: match.sets_to_win || 2,
                      },
                      playerStandings,
                      allPendingMatches,
                      knockoutSize
                    ) : { isDeadRubber: false, reason: "" };
                    
                    return (
                      <div
                        key={match.id}
                        onClick={() => {
                          if (canPlay) {
                            onMatchClick(match as any);
                          } else if (isCompleted && onEditMatch) {
                            onEditMatch(match);
                          }
                        }}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          isCompleted && "bg-muted/50 hover:border-accent cursor-pointer",
                          isSkipped && "bg-muted/20 opacity-60",
                          canPlay && "hover:border-primary cursor-pointer"
                        )}
                      >
                        <div className="flex items-center text-sm gap-2">
                          {(player1?.name || "TBD").length > NAME_TRUNCATE_THRESHOLD ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "truncate flex-1 text-left",
                                  match.winner_id === match.player1_id && "font-bold text-primary"
                                )}>
                                  {player1?.name || "TBD"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{player1?.name || "TBD"}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={cn(
                              "truncate flex-1 text-left",
                              match.winner_id === match.player1_id && "font-bold text-primary"
                            )}>
                              {player1?.name || "TBD"}
                            </span>
                          )}
                          
                          <div className="flex flex-col items-center shrink-0">
                            {isCompleted ? (
                              <span className="font-bold">
                                {match.player1_sets} - {match.player2_sets}
                              </span>
                            ) : isSkipped ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                <SkipForward className="w-3 h-3 mr-1" />
                                Hoppet over
                              </Badge>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-muted-foreground">vs</span>
                                {deadRubberInfo.isDeadRubber && onSkipMatch && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSkipMatch(match);
                                        }}
                                      >
                                        <SkipForward className="w-3 h-3 mr-1" />
                                        Hopp over
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{deadRubberInfo.reason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                            {isCompleted && match.winner_id && (
                              <div className="flex items-center gap-1 text-xs text-accent">
                                <Trophy className="w-3 h-3" />
                                <span className="truncate max-w-[80px]">
                                  {players.find(p => p.id === match.winner_id)?.name}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {(player2?.name || "TBD").length > NAME_TRUNCATE_THRESHOLD ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "truncate flex-1 text-right",
                                  match.winner_id === match.player2_id && "font-bold text-primary"
                                )}>
                                  {player2?.name || "TBD"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{player2?.name || "TBD"}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className={cn(
                              "truncate flex-1 text-right",
                              match.winner_id === match.player2_id && "font-bold text-primary"
                            )}>
                              {player2?.name || "TBD"}
                            </span>
                          )}
                        </div>
                        {isCompleted && (player1MatchAvg !== "-" || player2MatchAvg !== "-") && (
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>Avg: {player1MatchAvg}</span>
                            <span>Avg: {player2MatchAvg}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
