import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle2, SkipForward } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Match, Player } from "@/hooks/useTournaments";
import { getCountryFlag } from "./CountryFlagPicker";
import { isDeadRubberMatch, getKnockoutSize } from "@/lib/deadRubberDetection";

interface LeagueStandingsProps {
  players: Player[];
  matches: Match[];
  onMatchClick: (match: Match) => void;
  onEditMatch?: (match: Match) => void;
  onSkipMatch?: (match: Match) => void;
}

const NAME_TRUNCATE_THRESHOLD = 12;

export function LeagueStandings({ players, matches, onMatchClick, onEditMatch, onSkipMatch }: LeagueStandingsProps) {
  // Helper to get wins for a player from completed matches
  const completedMatches = matches.filter(m => m.status === "completed");
  const getPlayerWins = (playerId: string) => {
    return completedMatches.filter(m => m.winner_id === playerId).length;
  };

  // Helper to get leg difference for a player
  const getPlayerLegDiff = (playerId: string) => {
    let legsWon = 0;
    let legsLost = 0;
    completedMatches.forEach(m => {
      if (m.player1_id === playerId) {
        legsWon += m.player1_sets || 0;
        legsLost += m.player2_sets || 0;
      } else if (m.player2_id === playerId) {
        legsWon += m.player2_sets || 0;
        legsLost += m.player1_sets || 0;
      }
    });
    return legsWon - legsLost;
  };

  // Sort players by league standings
  const sortedPlayers = [...players].sort((a, b) => {
    // 1. Sort by wins first (most wins = highest rank)
    const aWins = getPlayerWins(a.id);
    const bWins = getPlayerWins(b.id);
    if (bWins !== aWins) {
      return bWins - aWins;
    }
    // 2. Then by leg difference as tiebreaker
    const aLegDiff = getPlayerLegDiff(a.id);
    const bLegDiff = getPlayerLegDiff(b.id);
    if (bLegDiff !== aLegDiff) {
      return bLegDiff - aLegDiff;
    }
    // 3. Then by average (higher is better) as final tiebreaker
    const aAvg = (a.total_darts || 0) > 0 ? ((a.total_score || 0) / (a.total_darts || 1)) * 3 : 0;
    const bAvg = (b.total_darts || 0) > 0 ? ((b.total_score || 0) / (b.total_darts || 1)) * 3 : 0;
    return bAvg - aAvg;
  });

  // Count pending matches (completedMatches already defined above)
  const pendingMatches = matches.filter(m => m.status === "pending");
  const skippedMatches = matches.filter(m => m.status === "skipped");
  const allCompleted = pendingMatches.length === 0;

  // Determine how many players will advance to knockout
  const knockoutSize = getKnockoutSize(players.length);

  // Prepare player standings for dead rubber detection
  const playerStandings = players.map(p => ({
    id: p.id,
    points: p.group_points || 0,
    setsWon: p.group_sets_won || 0,
    setsLost: p.group_sets_lost || 0,
    totalScore: p.total_score || 0,
    totalDarts: p.total_darts || 0,
  }));

  // Prepare pending matches for dead rubber detection
  const pendingMatchInfos = pendingMatches.map(m => ({
    id: m.id,
    player1Id: m.player1_id || "",
    player2Id: m.player2_id || "",
    status: m.status,
    setsToWin: m.sets_to_win || 2,
  }));

  const renderPlayerName = (player: Player) => {
    const shouldTruncate = player.name.length > NAME_TRUNCATE_THRESHOLD;
    const displayName = shouldTruncate 
      ? `${player.name.slice(0, NAME_TRUNCATE_THRESHOLD)}...` 
      : player.name;

    if (shouldTruncate) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{displayName}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{player.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return displayName;
  };


  return (
    <div className="space-y-6">
      {/* League Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Ligatabell
            <Badge variant="outline" className="ml-2">
              {completedMatches.length}/{matches.length} kamper spilt
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Spiller</TableHead>
                <TableHead className="text-center w-16">K</TableHead>
                <TableHead className="text-center w-16">V</TableHead>
                <TableHead className="text-center w-16">T</TableHead>
                <TableHead className="text-center w-20">LF</TableHead>
                <TableHead className="text-center w-20">Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => {
                const position = index + 1;
                const willAdvance = position <= knockoutSize;
                const avg = (player.total_darts || 0) > 0 
                  ? ((player.total_score || 0) / (player.total_darts || 1)) * 3 
                  : 0;
                
                const countryFlag = player.country ? getCountryFlag(player.country) : "";
                
                // Calculate matches played, won, lost from actual match data
                const playerMatches = matches.filter(
                  m => m.status === "completed" && (m.player1_id === player.id || m.player2_id === player.id)
                );
                const matchesPlayed = playerMatches.length;
                const matchesWon = playerMatches.filter(m => m.winner_id === player.id).length;
                const matchesLost = matchesPlayed - matchesWon;
                
                // Calculate leg difference (legs won - legs lost)
                let legsWon = 0;
                let legsLost = 0;
                playerMatches.forEach(m => {
                  if (m.player1_id === player.id) {
                    legsWon += m.player1_sets || 0;
                    legsLost += m.player2_sets || 0;
                  } else {
                    legsWon += m.player2_sets || 0;
                    legsLost += m.player1_sets || 0;
                  }
                });
                const legDiff = legsWon - legsLost;
                
                return (
                  <TableRow 
                    key={player.id}
                    className={willAdvance ? "bg-primary/5" : player.is_eliminated ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">
                      {position}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {countryFlag && <span className="text-base">{countryFlag}</span>}
                        {renderPlayerName(player)}
                        {willAdvance && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            Sluttspill
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{matchesPlayed}</TableCell>
                    <TableCell className="text-center text-green-600">{matchesWon}</TableCell>
                    <TableCell className="text-center text-red-600">{matchesLost}</TableCell>
                    <TableCell className={`text-center ${legDiff > 0 ? 'text-green-600' : legDiff < 0 ? 'text-red-600' : ''}`}>
                      {legDiff > 0 ? `+${legDiff}` : legDiff}
                    </TableCell>
                    <TableCell className="text-center">{avg.toFixed(1)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span>Går videre til sluttspill ({knockoutSize} beste)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* League Matches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allCompleted ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Resultater fra alle ligakamper - trykk på kampen om noen resultater må endres
              </>
            ) : (
              <>
                Ligakamper - trykk på en kamp for å starte
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {matches.map(match => {
              const player1 = players.find(p => p.id === match.player1_id);
              const player2 = players.find(p => p.id === match.player2_id);
              const isCompleted = match.status === "completed";
              const isSkipped = match.status === "skipped";
              const isPending = match.status === "pending";
              
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
                pendingMatchInfos,
                knockoutSize
              ) : { isDeadRubber: false, reason: "" };
              
              return (
                <div
                  key={match.id}
                  onClick={() => {
                    if (isPending) {
                      onMatchClick(match);
                    } else if (isCompleted && onEditMatch) {
                      onEditMatch(match);
                    }
                  }}
                  className={`p-3 rounded-lg border transition-all ${
                    isCompleted 
                      ? "bg-muted/50 hover:border-accent cursor-pointer" 
                      : isSkipped
                      ? "bg-muted/20 opacity-60"
                      : "hover:border-primary cursor-pointer"
                  }`}
                >
                  <div className="flex items-center text-sm gap-2">
                    {/* Player 1 name */}
                    <span className={`truncate flex-1 text-left ${
                      match.winner_id === player1?.id ? "font-bold text-primary" : 
                      match.winner_id === player2?.id ? "text-destructive" : ""
                    }`}>
                      {player1?.name || "TBD"}
                    </span>
                    
                    {/* Score or status in center */}
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
                            <TooltipProvider>
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
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Player 2 name */}
                    <span className={`truncate flex-1 text-right ${
                      match.winner_id === player2?.id ? "font-bold text-primary" : 
                      match.winner_id === player1?.id ? "text-destructive" : ""
                    }`}>
                      {player2?.name || "TBD"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
