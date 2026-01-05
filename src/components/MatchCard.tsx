import { Match } from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface MatchCardProps {
  match: Match;
  player1Name: string;
  player2Name: string;
  onClick: () => void;
}

export function MatchCard({ match, player1Name, player2Name, onClick }: MatchCardProps) {
  const isCompleted = match.status === "completed";
  const isTBD = player1Name === "TBD" || player2Name === "TBD";
  const canPlay = !isTBD && !isCompleted;

  return (
    <div
      onClick={canPlay ? onClick : undefined}
      className={cn(
        "w-56 rounded-lg border overflow-hidden transition-all",
        canPlay && "cursor-pointer hover:border-primary hover:shadow-lg hover:shadow-primary/20",
        isCompleted && "border-accent/50",
        !canPlay && !isCompleted && "opacity-60",
        "bg-card border-border"
      )}
    >
      <PlayerRow
        name={player1Name}
        score={match.player1_score}
        isWinner={match.winner_id === match.player1_id && isCompleted}
        isCompleted={isCompleted}
      />
      <div className="h-px bg-border" />
      <PlayerRow
        name={player2Name}
        score={match.player2_score}
        isWinner={match.winner_id === match.player2_id && isCompleted}
        isCompleted={isCompleted}
      />
    </div>
  );
}

function PlayerRow({
  name,
  score,
  isWinner,
  isCompleted,
}: {
  name: string;
  score: number;
  isWinner: boolean;
  isCompleted: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2",
        isWinner && "bg-primary/20"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isWinner && <Trophy className="w-4 h-4 text-accent shrink-0" />}
        <span
          className={cn(
            "truncate text-sm",
            isWinner && "font-semibold text-accent",
            name === "TBD" && "text-muted-foreground italic"
          )}
        >
          {name}
        </span>
      </div>
      {isCompleted && (
        <span
          className={cn(
            "text-sm font-bold ml-2",
            isWinner ? "text-accent" : "text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}
