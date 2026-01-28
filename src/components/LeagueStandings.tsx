import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Edit3, CheckCircle2, SkipForward } from "lucide-react";
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
  // Sort players by league standings
  const sortedPlayers = [...players].sort((a, b) => {
    // 1. Sort by points first
    if ((b.group_points || 0) !== (a.group_points || 0)) {
      return (b.group_points || 0) - (a.group_points || 0);
    }
    // 2. Then by sets difference
    const aSetDiff = (a.group_sets_won || 0) - (a.group_sets_lost || 0);
    const bSetDiff = (b.group_sets_won || 0) - (b.group_sets_lost || 0);
    if (bSetDiff !== aSetDiff) {
      return bSetDiff - aSetDiff;
    }
    // 3. Then by average (higher is better)
    const aAvg = (a.total_darts || 0) > 0 ? ((a.total_score || 0) / (a.total_darts || 1)) * 3 : 0;
    const bAvg = (b.total_darts || 0) > 0 ? ((b.total_score || 0) / (b.total_darts || 1)) * 3 : 0;
    return bAvg - aAvg;
  });

  // Count completed and pending matches
  const completedMatches = matches.filter(m => m.status === "completed");
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

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (position === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (position === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return null;
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
                
                // Calculate matches played, wins, losses from sets
                const wins = player.group_sets_won || 0;
                const losses = player.group_sets_lost || 0;
                const matchesPlayed = wins + losses > 0 ? Math.ceil((wins + losses) / 2) : 0;
                
                return (
                  <TableRow 
                    key={player.id}
                    className={willAdvance ? "bg-primary/5" : player.is_eliminated ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {getPositionIcon(position)}
                        {position}
                      </div>
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
                    <TableCell className="text-center text-green-600">{wins}</TableCell>
                    <TableCell className="text-center text-red-600">{losses}</TableCell>
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
              const winner = match.winner_id;
              
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
                  className={`p-3 rounded-lg border transition-colors ${
                    isCompleted 
                      ? "bg-muted/30 hover:bg-muted/50 cursor-pointer" 
                      : isSkipped
                      ? "bg-muted/20 opacity-60"
                      : "bg-card hover:bg-muted/20 cursor-pointer"
                  }`}
                  onClick={() => isPending && onMatchClick(match)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${winner === player1?.id ? "font-bold text-primary" : ""}`}>
                        {player1?.name || "TBD"}
                      </div>
                      <div className={`text-sm truncate ${winner === player2?.id ? "font-bold text-primary" : ""}`}>
                        {player2?.name || "TBD"}
                      </div>
                    </div>
                    
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className={`text-sm ${winner === player1?.id ? "font-bold" : ""}`}>
                            {match.player1_sets}
                          </div>
                          <div className={`text-sm ${winner === player2?.id ? "font-bold" : ""}`}>
                            {match.player2_sets}
                          </div>
                        </div>
                        {onEditMatch && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditMatch(match);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : isSkipped ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <SkipForward className="w-3 h-3 mr-1" />
                        Hoppet over
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        {deadRubberInfo.isDeadRubber && onSkipMatch && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
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
                        <Badge variant="outline" className="text-xs">
                          Venter
                        </Badge>
                      </div>
                    )}
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
