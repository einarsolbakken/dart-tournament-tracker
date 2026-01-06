import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTournament } from "@/hooks/useTournaments";
import { Plus, Trash2, Target, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";
import { generateGroups, calculateAdvancingPlayers } from "@/lib/groupGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CreateTournamentForm() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [name, setName] = useState("Bjølsen Open");
  const [date, setDate] = useState("2025-01-31");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [isCreating, setIsCreating] = useState(false);

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

  const validPlayerCount = playerNames.filter((n) => n.trim()).length;
  
  // Calculate group info for preview
  const getGroupPreview = () => {
    if (validPlayerCount < 3) return null;
    
    const testPlayers = playerNames
      .filter(n => n.trim())
      .map((name, i) => ({ id: `test-${i}`, name }));
    
    const groups = generateGroups(testPlayers);
    const advancing = calculateAdvancingPlayers(groups);
    const isEven = advancing % 2 === 0;
    
    return { groups, advancing, isEven };
  };
  
  const preview = getGroupPreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPlayers = playerNames.filter((n) => n.trim());
    if (validPlayers.length < 3) {
      toast.error("Du trenger minst 3 spillere for gruppespill");
      return;
    }

    setIsCreating(true);

    try {
      const tournament = await createTournament.mutateAsync({
        name,
        date,
        playerNames: validPlayers,
      });
      
      toast.success("Turnering opprettet!");
      navigate(`/tournament/${tournament.id}`);
    } catch (error) {
      toast.error("Kunne ikke opprette turnering");
      setIsCreating(false);
    }
  };

  if (isCreating) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12">
          <LoadingSpinner message="Genererer grupper og kamper..." />
        </CardContent>
      </Card>
    );
  }

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

          {/* Tournament format info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Turneringsformat
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• <strong>Gruppespill:</strong> 301, single checkout, first to 2 sets</li>
              <li>• <strong>Sluttspill:</strong> 301, dobbel checkout, first to 3 sets</li>
              <li>• Maks 4 spillere per gruppe, sistemann ryker</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Spillere ({validPlayerCount})
              </Label>
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

          {/* Group preview */}
          {preview && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Forhåndsvisning av grupper:</h4>
              <div className="flex flex-wrap gap-2">
                {preview.groups.map(group => (
                  <div key={group.name} className="bg-muted px-3 py-1.5 rounded-md text-sm">
                    Gruppe {group.name}: {group.playerIds.length} spillere
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {preview.advancing} spillere går videre til sluttspill
              </p>
              {!preview.isEven && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Oddetall spillere går videre. Den dårligste nest-sisteplassen elimineres også.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={createTournament.isPending || validPlayerCount < 3}
          >
            {createTournament.isPending ? "Oppretter..." : "Start Turnering"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
