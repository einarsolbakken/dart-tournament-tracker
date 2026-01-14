import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateTournament } from "@/hooks/useTournaments";
import { Plus, Trash2, Target, Users, AlertCircle, Trophy, LayoutGrid } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";
import { generateGroups, calculateAdvancingPlayers } from "@/lib/groupGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getValidMatchesPerPlayerOptions, getDefaultMatchesPerPlayer, getLeagueKnockoutSize, validateLeagueConfig } from "@/lib/leagueGenerator";

type TournamentFormat = "group" | "league";

export function CreateTournamentForm() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [name, setName] = useState("Bjølsen Open");
  const [date, setDate] = useState("2025-01-31");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [isCreating, setIsCreating] = useState(false);
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("group");
  const [matchesPerPlayer, setMatchesPerPlayer] = useState<number>(3);

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
  
  // Calculate group info for preview (only for group format)
  const getGroupPreview = () => {
    if (tournamentFormat !== "group" || validPlayerCount < 3) return null;
    
    const testPlayers = playerNames
      .filter(n => n.trim())
      .map((name, i) => ({ id: `test-${i}`, name }));
    
    const groups = generateGroups(testPlayers);
    const advancing = calculateAdvancingPlayers(groups, validPlayerCount);
    const isEven = advancing % 2 === 0;
    
    return { groups, advancing, isEven };
  };

  // Calculate league info for preview (only for league format)
  const getLeaguePreview = () => {
    if (tournamentFormat !== "league" || validPlayerCount < 2) return null;
    
    const config = validateLeagueConfig(validPlayerCount, matchesPerPlayer);
    const knockoutSize = getLeagueKnockoutSize(validPlayerCount);
    const validOptions = getValidMatchesPerPlayerOptions(validPlayerCount);
    
    return { ...config, knockoutSize, validOptions };
  };
  
  const groupPreview = getGroupPreview();
  const leaguePreview = getLeaguePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validPlayers = playerNames.filter((n) => n.trim());
    
    if (tournamentFormat === "group" && validPlayers.length < 3) {
      toast.error("Du trenger minst 3 spillere for gruppespill");
      return;
    }
    
    if (tournamentFormat === "league" && validPlayers.length < 2) {
      toast.error("Du trenger minst 2 spillere for ligasystem");
      return;
    }

    setIsCreating(true);

    try {
      const tournament = await createTournament.mutateAsync({
        name,
        date,
        playerNames: validPlayers,
        format: tournamentFormat,
        matchesPerPlayer: tournamentFormat === "league" ? matchesPerPlayer : undefined,
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

          {/* Tournament format selection */}
          <div className="space-y-4">
            <Label>Turneringsformat</Label>
            <RadioGroup 
              value={tournamentFormat} 
              onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="relative">
                <RadioGroupItem 
                  value="group" 
                  id="format-group" 
                  className="peer sr-only" 
                />
                <Label 
                  htmlFor="format-group" 
                  className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  <LayoutGrid className="w-8 h-8 mb-2 text-primary" />
                  <span className="font-medium">Gruppespill</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Tradisjonelle grupper → sluttspill
                  </span>
                </Label>
              </div>
              <div className="relative">
                <RadioGroupItem 
                  value="league" 
                  id="format-league" 
                  className="peer sr-only" 
                />
                <Label 
                  htmlFor="format-league" 
                  className="flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  <Trophy className="w-8 h-8 mb-2 text-primary" />
                  <span className="font-medium">Ligasystem</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Alle spiller like mange kamper
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Format info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {tournamentFormat === "group" ? "Gruppespill format" : "Ligasystem format"}
            </h4>
            {tournamentFormat === "group" ? (
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Gruppespill:</strong> 301, single checkout, first to 2 sets</li>
                <li>• <strong>Sluttspill:</strong> 301, dobbel checkout, first to 3 sets</li>
                <li>• Maks 4 spillere per gruppe, de beste går videre</li>
              </ul>
            ) : (
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Ligakamper:</strong> 301, single checkout, first to 2 sets</li>
                <li>• <strong>Sluttspill:</strong> 301, dobbel checkout, first to 3 sets</li>
                <li>• Alle spiller mot alle, beste 16/8/4/2 går videre</li>
              </ul>
            )}
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

          {/* Group preview - only for group format */}
          {groupPreview && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Forhåndsvisning av grupper:</h4>
              <div className="flex flex-wrap gap-2">
                {groupPreview.groups.map(group => (
                  <div key={group.name} className="bg-muted px-3 py-1.5 rounded-md text-sm">
                    Gruppe {group.name}: {group.playerIds.length} spillere
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {groupPreview.advancing} spillere går videre til sluttspill
              </p>
              {!groupPreview.isEven && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Oddetall spillere går videre. Den dårligste nest-sisteplassen elimineres også.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* League preview - only for league format */}
          {leaguePreview && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Kamper per spiller:</h4>
              <Select 
                value={matchesPerPlayer.toString()} 
                onValueChange={(v) => setMatchesPerPlayer(parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leaguePreview.validOptions.map(opt => (
                    <SelectItem key={opt} value={opt.toString()}>
                      {opt} kamper per spiller ({(validPlayerCount * opt) / 2} totalt)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {!leaguePreview.isValid && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{leaguePreview.errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {leaguePreview.isValid && (
                <p className="text-sm text-muted-foreground">
                  De {leaguePreview.knockoutSize} beste går videre til sluttspill
                </p>
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
