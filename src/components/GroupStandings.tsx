import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, XCircle } from "lucide-react";

interface Player {
  id: string;
  name: string;
  group_name: string | null;
  group_points: number;
  group_sets_won: number;
  group_sets_lost: number;
  is_eliminated: boolean;
}

interface Match {
  id: string;
  group_name: string | null;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  player1_sets: number;
  player2_sets: number;
  status: string;
  stage: string;
}

interface GroupStandingsProps {
  players: Player[];
  matches: Match[];
  onMatchClick: (match: Match) => void;
}

export function GroupStandings({ players, matches, onMatchClick }: GroupStandingsProps) {
  // Get unique group names
  const groupNames = [...new Set(players.map(p => p.group_name).filter(Boolean))].sort() as string[];
  
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groupNames.map(groupName => {
          const groupPlayers = players
            .filter(p => p.group_name === groupName)
            .sort((a, b) => {
              // Sort by points, then sets difference
              if (b.group_points !== a.group_points) {
                return b.group_points - a.group_points;
              }
              return (b.group_sets_won - b.group_sets_lost) - (a.group_sets_won - a.group_sets_lost);
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
                      <th className="text-center py-2 px-1">P</th>
                      <th className="text-center py-2 px-1">V</th>
                      <th className="text-center py-2 px-1">T</th>
                      <th className="text-center py-2 px-3">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupPlayers.map((player, index) => {
                      const isLast = index === groupPlayers.length - 1;
                      const wins = matches.filter(
                        m => m.group_name === groupName && 
                        m.status === "completed" && 
                        m.winner_id === player.id
                      ).length;
                      const losses = matches.filter(
                        m => m.group_name === groupName && 
                        m.status === "completed" && 
                        (m.player1_id === player.id || m.player2_id === player.id) &&
                        m.winner_id !== player.id
                      ).length;
                      
                      return (
                        <tr 
                          key={player.id}
                          className={cn(
                            "border-b border-border/50 last:border-0",
                            isLast && completedMatches === totalMatches && "bg-destructive/10",
                            player.is_eliminated && "opacity-50"
                          )}
                        >
                          <td className="py-2 px-3 text-muted-foreground">{index + 1}</td>
                          <td className="py-2 px-3 font-medium flex items-center gap-2">
                            {player.name}
                            {player.is_eliminated && (
                              <XCircle className="w-3 h-3 text-destructive" />
                            )}
                          </td>
                          <td className="text-center py-2 px-1 font-bold">{player.group_points}</td>
                          <td className="text-center py-2 px-1 text-green-500">{wins}</td>
                          <td className="text-center py-2 px-1 text-red-500">{losses}</td>
                          <td className="text-center py-2 px-3 text-xs">
                            {player.group_sets_won}-{player.group_sets_lost}
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
        <h3 className="font-display text-2xl">Gruppekamper</h3>
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
                    const canPlay = match.player1_id && match.player2_id && !isCompleted;
                    
                    return (
                      <div
                        key={match.id}
                        onClick={() => canPlay && onMatchClick(match as any)}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          isCompleted && "bg-muted/50",
                          canPlay && "hover:border-primary cursor-pointer"
                        )}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className={cn(
                            match.winner_id === match.player1_id && "font-bold text-primary"
                          )}>
                            {player1?.name || "TBD"}
                          </span>
                          {isCompleted ? (
                            <span className="font-bold">
                              {match.player1_sets} - {match.player2_sets}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">vs</span>
                          )}
                          <span className={cn(
                            match.winner_id === match.player2_id && "font-bold text-primary"
                          )}>
                            {player2?.name || "TBD"}
                          </span>
                        </div>
                        {isCompleted && match.winner_id && (
                          <div className="flex items-center justify-center gap-1 mt-1 text-xs text-accent">
                            <Trophy className="w-3 h-3" />
                            {players.find(p => p.id === match.winner_id)?.name}
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
  );
}
