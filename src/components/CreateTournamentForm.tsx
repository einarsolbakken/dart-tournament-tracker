import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateTournament } from "@/hooks/useTournaments";
import { Plus, Trash2, Target, Users, AlertCircle, Trophy, LayoutGrid, Zap, ArrowLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";
import { generateGroups, calculateAdvancingPlayers } from "@/lib/groupGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getValidMatchesPerPlayerOptions, getDefaultMatchesPerPlayer, getLeagueKnockoutSize, validateLeagueConfig } from "@/lib/leagueGenerator";
import { cn } from "@/lib/utils";

type TournamentFormat = "group" | "league";

export function CreateTournamentForm() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
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
  
  // Check for duplicate names (case-insensitive, trimmed)
  const getDuplicateNames = (): Set<string> => {
    const trimmedNames = playerNames
      .map(n => n.trim().toLowerCase())
      .filter(n => n.length > 0);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    for (const name of trimmedNames) {
      if (seen.has(name)) {
        duplicates.add(name);
      }
      seen.add(name);
    }
    return duplicates;
  };
  
  const duplicateNames = getDuplicateNames();
  const hasDuplicates = duplicateNames.size > 0;
  
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
    
    // Check for duplicates
    if (hasDuplicates) {
      toast.error("Spillere kan ikke ha samme navn");
      return;
    }
    
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
      <div className="max-w-2xl mx-auto">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <CardContent className="py-16 relative">
            <LoadingSpinner message="Genererer grupper og kamper..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with back button on left, title centered */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Back button - absolute left */}
        <Link to="/" className="absolute left-0">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Tilbake
          </Button>
        </Link>
        
        {/* Centered title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl">Ny Turnering</h1>
            <p className="text-muted-foreground text-sm">Opprett din neste dartkonkurranse</p>
          </div>
        </div>
      </div>

      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-black/20">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <CardContent className="pt-6 pb-6 relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tournament details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Turneringsnavn
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="F.eks. Fredagspils Open"
                  required
                  className="bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Dato
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Tournament format selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Turneringsformat</Label>
              <RadioGroup 
                value={tournamentFormat} 
                onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
                className="grid grid-cols-2 gap-4"
              >
                <div className="relative group">
                  <RadioGroupItem 
                    value="group" 
                    id="format-group" 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor="format-group" 
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all duration-300",
                      "border-2 bg-muted/30 hover:bg-muted/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/15",
                      "peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-primary/20",
                      "group-hover:scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all",
                      "bg-muted/50 group-hover:bg-primary/20",
                      tournamentFormat === "group" && "bg-primary/30"
                    )}>
                      <LayoutGrid className="w-7 h-7 text-primary" />
                    </div>
                    <span className="font-semibold text-lg">Gruppespill</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Tradisjonelle grupper → sluttspill
                    </span>
                  </Label>
                </div>
                
                <div className="relative group">
                  <RadioGroupItem 
                    value="league" 
                    id="format-league" 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor="format-league" 
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all duration-300",
                      "border-2 bg-muted/30 hover:bg-muted/50",
                      "peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/15",
                      "peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-accent/20",
                      "group-hover:scale-[1.02]"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all",
                      "bg-muted/50 group-hover:bg-accent/20",
                      tournamentFormat === "league" && "bg-accent/30"
                    )}>
                      <Trophy className="w-7 h-7 text-accent" />
                    </div>
                    <span className="font-semibold text-lg">Ligasystem</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      Alle spiller like mange kamper
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Format info - enhanced */}
            <div className="relative rounded-xl border border-border/50 bg-muted/30 p-5 space-y-3">
              <div className="absolute -top-3 left-4 px-2 bg-card">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {tournamentFormat === "group" ? "Gruppespill format" : "Ligasystem format"}
                </span>
              </div>
              {tournamentFormat === "group" ? (
                <ul className="space-y-2 text-sm pt-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span><strong className="text-foreground">Gruppespill:</strong> <span className="text-muted-foreground">301, single checkout, first to 2 sets</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span><strong className="text-foreground">Sluttspill:</strong> <span className="text-muted-foreground">301, dobbel checkout, first to 3 sets</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                    <span className="text-muted-foreground">Maks 4 spillere per gruppe, de beste går videre</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm pt-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span><strong className="text-foreground">Ligakamper:</strong> <span className="text-muted-foreground">301, single checkout, first to 2 sets</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span><strong className="text-foreground">Sluttspill:</strong> <span className="text-muted-foreground">301, dobbel checkout, first to 3 sets</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 shrink-0" />
                    <span className="text-muted-foreground">Alle spiller like mange kamper, beste 16/8/4/2 går videre</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Players section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-primary" />
                  Spillere 
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                    {validPlayerCount}
                  </span>
                </Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addPlayer}
                  className="border-primary/50 hover:bg-primary/10 hover:border-primary transition-all"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Legg til
                </Button>
              </div>
              
              <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                {playerNames.map((playerName, index) => (
                  <div 
                    key={index} 
                    className="flex gap-2 group animate-in fade-in slide-in-from-left-2 duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="w-8 h-10 flex items-center justify-center text-sm text-muted-foreground font-medium">
                      {index + 1}.
                    </div>
                    <Input
                      value={playerName}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      placeholder={`Spiller ${index + 1}`}
                      className={cn(
                        "flex-1 bg-muted/30 border-border/50 transition-all",
                        "focus:border-primary focus:ring-primary/20",
                        "group-hover:border-border",
                        playerName.trim() && duplicateNames.has(playerName.trim().toLowerCase()) && 
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayer(index)}
                      disabled={playerNames.length <= 2}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {hasDuplicates && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Spillere kan ikke ha samme navn. Vennligst gi unike navn til alle spillere.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Group preview - enhanced */}
            {groupPreview && (
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  Forhåndsvisning av grupper
                </h4>
                <div className="flex flex-wrap gap-2">
                  {groupPreview.groups.map(group => (
                    <div 
                      key={group.name} 
                      className="bg-muted/50 border border-border/50 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      Gruppe {group.name}: <span className="text-primary">{group.playerIds.length}</span> spillere
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" />
                  {groupPreview.advancing} spillere går videre til sluttspill
                </p>
                {!groupPreview.isEven && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Oddetall spillere går videre. Den dårligste nest-sisteplassen elimineres også.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* League preview - enhanced */}
            {leaguePreview && (
              <div className="space-y-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" />
                  Kamper per spiller
                </h4>
                <Select 
                  value={matchesPerPlayer.toString()} 
                  onValueChange={(v) => setMatchesPerPlayer(parseInt(v))}
                >
                  <SelectTrigger className="w-full bg-muted/30 border-border/50">
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
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{leaguePreview.errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {leaguePreview.isValid && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    De {leaguePreview.knockoutSize} beste går videre til sluttspill
                  </p>
                )}
              </div>
            )}

            {/* Submit button - enhanced */}
            <Button
              type="submit"
              size="lg"
              className={cn(
                "w-full relative overflow-hidden font-semibold text-lg py-6",
                "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "transition-all duration-300 hover:scale-[1.02]",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
              disabled={createTournament.isPending || validPlayerCount < 3 || hasDuplicates}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                {createTournament.isPending ? "Oppretter..." : "Start Turnering"}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
