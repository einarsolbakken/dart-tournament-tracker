import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTournament } from "@/hooks/useTournaments";
import { Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";

export function CreateTournamentForm() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [name, setName] = useState("Bjølsen Open");
  const [date, setDate] = useState("2025-01-31");
  const [gameMode, setGameMode] = useState("501");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);

  const addPlayer = () => {
    setPlayerNames([...playerNames, ""]);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPlayers = playerNames.filter((n) => n.trim());
    if (validPlayers.length < 2) {
      toast.error("Du trenger minst 2 spillere");
      return;
    }

    try {
      const tournament = await createTournament.mutateAsync({
        name,
        date,
        gameMode,
        playerNames: validPlayers,
      });
      
      toast.success("Turnering opprettet!");
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      toast.error("Kunne ikke opprette turnering");
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-display text-3xl flex items-center gap-3">
          <Target className="w-8 h-8 text-primary" />
          Ny Turnering
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Turneringsnavn</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bjølsen Open"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Dato</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Spillmodus</Label>
            <Select value={gameMode} onValueChange={setGameMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="501">501 (Standard)</SelectItem>
                <SelectItem value="201">201 (Kort)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Spillere ({playerNames.filter(n => n.trim()).length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPlayer}>
                <Plus className="w-4 h-4 mr-1" />
                Legg til
              </Button>
            </div>
            
            <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
              {playerNames.map((playerName, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-8 h-10 flex items-center justify-center text-sm text-muted-foreground font-medium">
                    {index + 1}.
                  </div>
                  <Input
                    value={playerName}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    placeholder={`Spiller ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(index)}
                    disabled={playerNames.length <= 2}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={createTournament.isPending}
          >
            {createTournament.isPending ? "Oppretter..." : "Start Turnering"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
