import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Match, Player } from "@/hooks/useTournaments";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";

interface EditMatchDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  onClose: () => void;
}

export function EditMatchDialog({ match, players, tournamentId, onClose }: EditMatchDialogProps) {
  const queryClient = useQueryClient();
  const [player1Sets, setPlayer1Sets] = useState<number>(0);
  const [player2Sets, setPlayer2Sets] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const player1 = match ? players.find(p => p.id === match.player1_id) : null;
  const player2 = match ? players.find(p => p.id === match.player2_id) : null;

  // Initialize with existing values when match changes
  useEffect(() => {
    if (match) {
      setPlayer1Sets(match.player1_sets || 0);
      setPlayer2Sets(match.player2_sets || 0);
    }
  }, [match]);

  if (!match) return null;

  const handleSubmit = async () => {
    if (player1Sets === player2Sets) {
      toast.error("Det må være en vinner - settene kan ikke være like");
      return;
    }

    setIsSubmitting(true);
    try {
      const winnerId = player1Sets > player2Sets ? match.player1_id : match.player2_id;

      // Update the match
      await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_sets: player1Sets,
          player2_sets: player2Sets,
        })
        .eq("id", match.id);

      // Recalculate stats for affected players if this is a group/league match
      if (match.stage === "group" || match.stage === "league") {
        await recalculatePlayerStats(tournamentId, match.player1_id, match.player2_id);
      }

      queryClient.invalidateQueries({ queryKey: ["matches", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["players", tournamentId] });
      toast.success("Kampresultat oppdatert");
      onClose();
    } catch (error) {
      toast.error("Kunne ikke oppdatere kamp");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Recalculate stats for players based on all their completed matches
  const recalculatePlayerStats = async (
    tournamentId: string, 
    player1Id: string | null, 
    player2Id: string | null
  ) => {
    const playerIds = [player1Id, player2Id].filter(Boolean) as string[];
    
    for (const playerId of playerIds) {
      // Get all completed matches for this player in group/league stage
      const { data: playerMatches } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .in("stage", ["group", "league"])
        .eq("status", "completed")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`);

      if (!playerMatches) continue;

      // Calculate stats from all matches
      let points = 0;
      let setsWon = 0;
      let setsLost = 0;
      let totalDarts = 0;
      let totalScore = 0;

      for (const m of playerMatches) {
        const isPlayer1 = m.player1_id === playerId;
        const isWinner = m.winner_id === playerId;
        
        if (isWinner) {
          points += 2;
        }
        
        setsWon += isPlayer1 ? (m.player1_sets || 0) : (m.player2_sets || 0);
        setsLost += isPlayer1 ? (m.player2_sets || 0) : (m.player1_sets || 0);
        totalDarts += isPlayer1 ? (m.player1_darts || 0) : (m.player2_darts || 0);
        totalScore += isPlayer1 ? (m.player1_total_score || 0) : (m.player2_total_score || 0);
      }

      // Update player stats
      await supabase
        .from("players")
        .update({
          group_points: points,
          group_sets_won: setsWon,
          group_sets_lost: setsLost,
          total_darts: totalDarts,
          total_score: totalScore,
        })
        .eq("id", playerId);
    }
  };

  const isPlayer1Winner = player1Sets > player2Sets;
  const isPlayer2Winner = player2Sets > player1Sets;

  return (
    <Dialog open={!!match} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endre kampresultat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Player 1 */}
          <div className="flex items-center justify-between">
            <Label className={`text-lg ${isPlayer1Winner ? 'text-primary font-bold' : ''}`}>
              {player1?.name}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayer1Sets(Math.max(0, player1Sets - 1))}
                disabled={player1Sets <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className={`text-2xl font-bold w-8 text-center ${isPlayer1Winner ? 'text-primary' : ''}`}>
                {player1Sets}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayer1Sets(player1Sets + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-center text-muted-foreground text-sm">vs</div>

          {/* Player 2 */}
          <div className="flex items-center justify-between">
            <Label className={`text-lg ${isPlayer2Winner ? 'text-primary font-bold' : ''}`}>
              {player2?.name}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayer2Sets(Math.max(0, player2Sets - 1))}
                disabled={player2Sets <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className={`text-2xl font-bold w-8 text-center ${isPlayer2Winner ? 'text-primary' : ''}`}>
                {player2Sets}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPlayer2Sets(player2Sets + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || player1Sets === player2Sets}
          >
            Lagre endringer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
