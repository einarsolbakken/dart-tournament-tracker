import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MatchScoring } from "./MatchScoring";
import { Match, Player, useUpdateGroupMatch, useUpdateKnockoutMatch } from "@/hooks/useTournaments";
import { toast } from "sonner";

interface ScoreDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  onClose: () => void;
}

export function ScoreDialog({
  match,
  players,
  tournamentId,
  onClose,
}: ScoreDialogProps) {
  const updateGroupMatch = useUpdateGroupMatch();
  const updateKnockoutMatch = useUpdateKnockoutMatch();

  if (!match) return null;

  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);
  const isGroupStage = match.stage === "group";

  const handleComplete = async (
    winnerId: string,
    loserId: string,
    player1Sets: number,
    player2Sets: number
  ) => {
    try {
      if (isGroupStage) {
        await updateGroupMatch.mutateAsync({
          matchId: match.id,
          winnerId,
          loserId,
          player1Sets,
          player2Sets,
          tournamentId,
        });
      } else {
        await updateKnockoutMatch.mutateAsync({
          matchId: match.id,
          winnerId,
          player1Sets,
          player2Sets,
          tournamentId,
        });
      }
      onClose();
    } catch (error) {
      toast.error("Kunne ikke oppdatere kamp");
    }
  };

  return (
    <Dialog open={!!match} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] xl:max-w-7xl max-h-[95vh] overflow-y-auto p-6 xl:p-8">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-center">
            {player1?.name} vs {player2?.name}
          </DialogTitle>
        </DialogHeader>
        
        <MatchScoring
          match={match}
          players={players}
          tournamentId={tournamentId}
          stage={isGroupStage ? "group" : "knockout"}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
