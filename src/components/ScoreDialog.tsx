import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Match, useUpdateMatch, Player } from "@/hooks/useTournaments";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  onClose: () => void;
}

export function ScoreDialog({ match, players, tournamentId, onClose }: ScoreDialogProps) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const updateMatch = useUpdateMatch();

  if (!match) return null;

  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);

  const canSubmit = player1Score !== player2Score && (player1Score > 0 || player2Score > 0);
  const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id;

  const handleSubmit = async () => {
    if (!winnerId) return;
    
    await updateMatch.mutateAsync({
      matchId: match.id,
      winnerId,
      player1Score,
      player2Score,
      tournamentId,
    });
    
    setPlayer1Score(0);
    setPlayer2Score(0);
    onClose();
  };

  return (
    <Dialog open={!!match} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            Registrer Resultat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4 items-center">
            <PlayerScoreInput
              name={player1?.name || "Spiller 1"}
              score={player1Score}
              onChange={setPlayer1Score}
              isWinning={player1Score > player2Score}
            />
            
            <div className="text-center">
              <span className="text-2xl font-display text-muted-foreground">VS</span>
            </div>
            
            <PlayerScoreInput
              name={player2?.name || "Spiller 2"}
              score={player2Score}
              onChange={setPlayer2Score}
              isWinning={player2Score > player1Score}
            />
          </div>

          {canSubmit && (
            <div className="text-center p-3 bg-primary/20 rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="font-semibold">
                  Vinner: {player1Score > player2Score ? player1?.name : player2?.name}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || updateMatch.isPending}
            className="w-full"
            size="lg"
          >
            {updateMatch.isPending ? "Lagrer..." : "Bekreft Resultat"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlayerScoreInput({
  name,
  score,
  onChange,
  isWinning,
}: {
  name: string;
  score: number;
  onChange: (score: number) => void;
  isWinning: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className={cn(
        "block text-center font-semibold truncate",
        isWinning && "text-accent"
      )}>
        {name}
      </Label>
      <Input
        type="number"
        min="0"
        value={score}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className={cn(
          "text-center text-2xl font-bold h-16",
          isWinning && "border-accent"
        )}
      />
    </div>
  );
}
