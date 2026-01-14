import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Match, Player } from "@/hooks/useTournaments";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface EditMatchDialogProps {
  match: Match | null;
  players: Player[];
  tournamentId: string;
  onClose: () => void;
}

export function EditMatchDialog({ match, players, tournamentId, onClose }: EditMatchDialogProps) {
  const queryClient = useQueryClient();
  const [winnerId, setWinnerId] = useState<string>("");
  const [winnerSets, setWinnerSets] = useState<string>("2");
  const [loserSets, setLoserSets] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!match) return null;

  const player1 = players.find(p => p.id === match.player1_id);
  const player2 = players.find(p => p.id === match.player2_id);

  const handleSubmit = async () => {
    if (!winnerId) {
      toast.error("Velg en vinner");
      return;
    }

    setIsSubmitting(true);
    try {
      const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
      const player1Sets = winnerId === match.player1_id ? parseInt(winnerSets) : parseInt(loserSets);
      const player2Sets = winnerId === match.player2_id ? parseInt(winnerSets) : parseInt(loserSets);

      // Store old match data for stats recalculation
      const oldWinnerId = match.winner_id;
      const oldPlayer1Sets = match.player1_sets;
      const oldPlayer2Sets = match.player2_sets;

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

  return (
    <Dialog open={!!match} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endre kampresultat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vinner</Label>
            <Select value={winnerId} onValueChange={setWinnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg vinner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={match.player1_id || ""}>{player1?.name}</SelectItem>
                <SelectItem value={match.player2_id || ""}>{player2?.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vinner sett</Label>
              <Select value={winnerSets} onValueChange={setWinnerSets}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taper sett</Label>
              <Select value={loserSets} onValueChange={setLoserSets}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Lagre endringer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}