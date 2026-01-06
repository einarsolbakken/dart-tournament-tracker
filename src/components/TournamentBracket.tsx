import { Match, Player } from "@/hooks/useTournaments";
import { MatchCard } from "./MatchCard";

interface TournamentBracketProps {
  matches: Match[];
  players: Player[];
  gameMode: string;
  tournamentId: string;
  onMatchClick: (match: Match) => void;
}

export function TournamentBracket({
  matches,
  players,
  gameMode,
  tournamentId,
  onMatchClick,
}: TournamentBracketProps) {
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return "TBD";
    const player = players.find((p) => p.id === playerId);
    return player?.name || "Unknown";
  };

  const totalRounds = Math.max(...matches.map((m) => m.round));
  const roundNames = getRoundNames(totalRounds);

  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => (
          <div key={round} className="flex flex-col">
            <h3 className="font-display text-lg text-accent mb-4 text-center uppercase tracking-wider">
              {roundNames[round - 1] || `Runde ${round}`}
            </h3>
            <div
              className="flex flex-col justify-around flex-1 gap-4"
              style={{ minHeight: `${matchesByRound[1]?.length * 100}px` }}
            >
              {matchesByRound[round]?.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  player1Name={getPlayerName(match.player1_id)}
                  player2Name={getPlayerName(match.player2_id)}
                  onClick={() => onMatchClick(match)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRoundNames(totalRounds: number): string[] {
  const names: string[] = [];
  for (let i = 1; i <= totalRounds; i++) {
    const remaining = totalRounds - i;
    if (remaining === 0) names.push("Finale");
    else if (remaining === 1) names.push("Semifinale");
    else if (remaining === 2) names.push("Kvartfinale");
    else names.push(`Runde ${i}`);
  }
  return names;
}
