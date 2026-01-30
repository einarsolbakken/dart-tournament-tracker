import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MatchScoring } from "./MatchScoring";
import { Match, Player, useUpdateGroupMatch, useUpdateKnockoutMatch } from "@/hooks/useTournaments";
import { toast } from "sonner";

interface ScoreDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  showCheckoutSuggestions: boolean;
  groupCheckoutType: string;
  knockoutCheckoutType: string;
  groupSetsToWin: number;
  knockoutSetsToWin: number;
  onClose: () => void;
}

export function ScoreDialog({
  match,
  players,
  tournamentId,
  showCheckoutSuggestions,
  groupCheckoutType,
  knockoutCheckoutType,
  groupSetsToWin,
  knockoutSetsToWin,
  onClose,
}: ScoreDialogProps) {
  const updateGroupMatch = useUpdateGroupMatch();
  const updateKnockoutMatch = useUpdateKnockoutMatch();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (!match) return null;

  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);
  const isGroupOrLeagueStage = match.stage === "group" || match.stage === "league";

  const handleComplete = async (
    winnerId: string,
    loserId: string,
    player1Sets: number,
    player2Sets: number,
    player1TotalScore: number,
    player1Darts: number,
    player2TotalScore: number,
    player2Darts: number
  ) => {
    try {
      if (isGroupOrLeagueStage) {
        await updateGroupMatch.mutateAsync({
          matchId: match.id,
          winnerId,
          loserId,
          player1Sets,
          player2Sets,
          player1TotalScore,
          player1Darts,
          player2TotalScore,
          player2Darts,
          tournamentId,
        });
      } else {
        await updateKnockoutMatch.mutateAsync({
          matchId: match.id,
          winnerId,
          player1Sets,
          player2Sets,
          player1TotalScore,
          player1Darts,
          player2TotalScore,
          player2Darts,
          tournamentId,
        });
      }
      onClose();
    } catch (error) {
      toast.error("Kunne ikke oppdatere kamp");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={!!match} onOpenChange={handleOpenChange}>
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
            stage={isGroupOrLeagueStage ? "group" : "knockout"}
            showCheckoutSuggestions={showCheckoutSuggestions}
            checkoutType={isGroupOrLeagueStage ? groupCheckoutType : knockoutCheckoutType}
            setsToWin={isGroupOrLeagueStage ? groupSetsToWin : knockoutSetsToWin}
            onComplete={handleComplete}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avslutte kampen?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil avslutte kampen? Fremgang vil gå tapt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fortsett kamp</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive hover:bg-destructive/90">
              Avslutt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
