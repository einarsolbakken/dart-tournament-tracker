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

      await supabase
        .from("matches")
        .update({
          winner_id: winnerId,
          player1_sets: player1Sets,
          player2_sets: player2Sets,
        })
        .eq("id", match.id);

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