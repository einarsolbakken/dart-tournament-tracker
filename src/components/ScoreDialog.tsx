import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Match, Player } from "@/hooks/useTournaments";
import { MatchScoring } from "./MatchScoring";

interface ScoreDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  gameMode: string;
  onClose: () => void;
}

export function ScoreDialog({ match, players, tournamentId, gameMode, onClose }: ScoreDialogProps) {
  if (!match) return null;

  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);

  return (
    <Dialog open={!!match} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            {player1?.name} vs {player2?.name}
          </DialogTitle>
        </DialogHeader>

        <MatchScoring
          match={match}
          players={players}
          tournamentId={tournamentId}
          gameMode={gameMode}
          onComplete={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
