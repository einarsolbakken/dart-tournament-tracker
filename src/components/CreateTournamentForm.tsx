import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateTournament } from "@/hooks/useTournaments";
import { Plus, Trash2, Target, Users, AlertCircle, Trophy, LayoutGrid, Zap, ArrowLeft, CalendarIcon, Settings, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";
import { generateGroups, calculateAdvancingPlayers } from "@/lib/groupGenerator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getValidMatchesPerPlayerOptions, getDefaultMatchesPerPlayer, getLeagueKnockoutSize, validateLeagueConfig } from "@/lib/leagueGenerator";
import { cn } from "@/lib/utils";
import { CountryFlagPicker } from "./CountryFlagPicker";

type TournamentFormat = "group" | "league";

export function CreateTournamentForm() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [playerCountries, setPlayerCountries] = useState<string[]>(["", ""]);
  const [isCreating, setIsCreating] = useState(false);
  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>("group");
  const [matchesPerPlayer, setMatchesPerPlayer] = useState<number>(3);
  
  // Game rules state
  const [gameMode, setGameMode] = useState<string>("301");
  const [groupSetsToWin, setGroupSetsToWin] = useState<number>(2);
  const [knockoutSetsToWin, setKnockoutSetsToWin] = useState<number>(3);
  const [groupCheckoutType, setGroupCheckoutType] = useState<string>("single");
  const [knockoutCheckoutType, setKnockoutCheckoutType] = useState<string>("double");

  const addPlayer = () => {
    setPlayerNames([...playerNames, ""]);
    setPlayerCountries([...playerCountries, ""]);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
      setPlayerCountries(playerCountries.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const updatePlayerCountry = (index: number, value: string) => {
    const updated = [...playerCountries];
    updated[index] = value;
    setPlayerCountries(updated);
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
        date: format(date, "yyyy-MM-dd"),
        playerNames: validPlayers,
        format: tournamentFormat,
        matchesPerPlayer: tournamentFormat === "league" ? matchesPerPlayer : undefined,
        gameMode,
        groupSetsToWin,
        knockoutSetsToWin,
        groupCheckoutType,
        knockoutCheckoutType,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 w-full max-w-md">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <CardContent className="py-16 relative">
            <LoadingSpinner message="Genererer grupper og kamper..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-8">
      {/* Header */}
      <div className="relative flex items-center justify-center mb-8">
        <Link to="/" className="absolute left-0">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Tilbake</span>
          </Button>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-display text-2xl md:text-3xl">Ny Turnering</h1>
            <p className="text-muted-foreground text-sm hidden sm:block">Opprett din neste dartkonkurranse</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Two-Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          
          {/* LEFT COLUMN - Tournament Settings */}
          <div className="space-y-6">
            {/* Tournament Info Card */}
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl shadow-black/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
              <CardContent className="pt-6 pb-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Turneringsinfo</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Navn
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
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                      Dato
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-muted/50 border-border/50 hover:bg-muted",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: nb }) : <span>Velg dato</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => d && setDate(d)}
                          initialFocus
                          locale={nb}
                          className="pointer-events-auto rounded-md border bg-popover"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Format Card */}
            <Card className="relative overflow-hidden border-border/30 bg-card/80 shadow-lg">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Turneringsformat</h2>
                </div>
                
                <RadioGroup 
                  value={tournamentFormat} 
                  onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative group">
                    <RadioGroupItem value="group" id="format-group" className="peer sr-only" />
                    <Label 
                      htmlFor="format-group" 
                      className={cn(
                        "flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-300",
                        "border-2 bg-muted/30 hover:bg-muted/50",
                        "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/15",
                        "peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-primary/20",
                        "group-hover:scale-[1.02]"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all",
                        "bg-muted/50 group-hover:bg-primary/20",
                        tournamentFormat === "group" && "bg-primary/30"
                      )}>
                        <LayoutGrid className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-semibold">Gruppespill</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Grupper → Sluttspill
                      </span>
                    </Label>
                  </div>
                  
                  <div className="relative group">
                    <RadioGroupItem value="league" id="format-league" className="peer sr-only" />
                    <Label 
                      htmlFor="format-league" 
                      className={cn(
                        "flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-300",
                        "border-2 bg-muted/30 hover:bg-muted/50",
                        "peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/15",
                        "peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:shadow-accent/20",
                        "group-hover:scale-[1.02]"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all",
                        "bg-muted/50 group-hover:bg-accent/20",
                        tournamentFormat === "league" && "bg-accent/30"
                      )}>
                        <Trophy className="w-6 h-6 text-accent" />
                      </div>
                      <span className="font-semibold">Ligasystem</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Like mange kamper
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Game Rules Card */}
            <Card className="relative overflow-hidden border-border/30 bg-card/80 shadow-lg">
              <CardContent className="pt-6 pb-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-accent" />
                  <h2 className="font-semibold text-lg">Spilleregler</h2>
                </div>
                
                {/* Game Mode */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Spillmodus</Label>
                  <div className="flex gap-2">
                    {["201", "301", "501"].map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        variant={gameMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGameMode(mode)}
                        className={cn(
                          "flex-1 transition-all",
                          gameMode === mode && "shadow-md"
                        )}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Group/League Rules */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {tournamentFormat === "group" ? "Gruppespill" : "Ligakamper"}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Sets for å vinne</Label>
                      <Select value={String(groupSetsToWin)} onValueChange={(v) => setGroupSetsToWin(Number(v))}>
                        <SelectTrigger className="bg-muted/50 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>First to {n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Checkout</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant={groupCheckoutType === "single" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGroupCheckoutType("single")}
                          className="flex-1 h-9 text-xs"
                        >
                          Single
                        </Button>
                        <Button
                          type="button"
                          variant={groupCheckoutType === "double" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGroupCheckoutType("double")}
                          className="flex-1 h-9 text-xs"
                        >
                          Dobbel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Knockout Rules */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sluttspill</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Sets for å vinne</Label>
                      <Select value={String(knockoutSetsToWin)} onValueChange={(v) => setKnockoutSetsToWin(Number(v))}>
                        <SelectTrigger className="bg-muted/50 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>First to {n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Checkout</Label>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant={knockoutCheckoutType === "single" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setKnockoutCheckoutType("single")}
                          className="flex-1 h-9 text-xs"
                        >
                          Single
                        </Button>
                        <Button
                          type="button"
                          variant={knockoutCheckoutType === "double" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setKnockoutCheckoutType("double")}
                          className="flex-1 h-9 text-xs"
                        >
                          Dobbel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rules Summary */}
                <div className="pt-3 border-t border-border/30 text-xs text-muted-foreground space-y-1">
                  <p><span className="text-foreground font-medium">{tournamentFormat === "group" ? "Gruppespill" : "Liga"}:</span> {gameMode}, {groupCheckoutType === "single" ? "single" : "dobbel"} checkout, first to {groupSetsToWin}</p>
                  <p><span className="text-foreground font-medium">Sluttspill:</span> {gameMode}, {knockoutCheckoutType === "single" ? "single" : "dobbel"} checkout, first to {knockoutSetsToWin}</p>
                </div>
              </CardContent>
            </Card>

            {/* Group/League Preview */}
            {groupPreview && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-5 pb-5 space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    Forhåndsvisning
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {groupPreview.groups.map(group => (
                      <div 
                        key={group.name} 
                        className="bg-muted/50 border border-border/50 px-3 py-1.5 rounded-lg text-sm"
                      >
                        Gruppe {group.name}: <span className="text-primary font-medium">{group.playerIds.length}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    {groupPreview.advancing} spillere går videre
                  </p>
                  {!groupPreview.isEven && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Oddetall spillere går videre. Den dårligste elimineres.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {leaguePreview && (
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="pt-5 pb-5 space-y-3">
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
                      <AlertDescription className="text-xs">{leaguePreview.errorMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  {leaguePreview.isValid && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-accent" />
                      De {leaguePreview.knockoutSize} beste går videre
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN - Players */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-card via-card to-accent/5 shadow-xl shadow-black/20">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />
              <CardContent className="pt-6 pb-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <h2 className="font-semibold text-lg">Spillere</h2>
                    <span className="ml-1 px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-sm font-bold">
                      {validPlayerCount}
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPlayer}
                    className="border-accent/50 hover:bg-accent/10 hover:border-accent transition-all"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Legg til
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto overflow-x-visible px-1 -mx-1 scrollbar-thin">
                  {playerNames.map((playerName, index) => (
                    <div 
                      key={index} 
                      className="flex gap-2 group animate-in fade-in slide-in-from-right-2 duration-200"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="w-7 h-10 flex items-center justify-center text-sm text-muted-foreground font-medium shrink-0">
                        {index + 1}.
                      </div>
                      <div className={cn(
                        "flex-1 flex min-w-0 rounded-md ring-offset-background transition-all",
                        "focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2",
                        playerName.trim() && duplicateNames.has(playerName.trim().toLowerCase()) && 
                          "focus-within:ring-destructive"
                      )}>
                        <Input
                          value={playerName}
                          onChange={(e) => updatePlayerName(index, e.target.value)}
                          placeholder={`Spiller ${index + 1}`}
                          className={cn(
                            "flex-1 bg-muted/30 border-border/50 transition-all rounded-r-none border-r-0",
                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                            "group-hover:border-border",
                            playerName.trim() && duplicateNames.has(playerName.trim().toLowerCase()) && 
                              "border-destructive"
                          )}
                        />
                        <div className="border border-l-0 border-border/50 rounded-r-md bg-muted/30 flex items-center group-hover:border-border transition-all">
                          <CountryFlagPicker
                            value={playerCountries[index]}
                            onChange={(code) => updatePlayerCountry(index, code)}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlayer(index)}
                        disabled={playerNames.length <= 2}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {hasDuplicates && (
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Spillere kan ikke ha samme navn.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <div className="pt-4 border-t border-border/30">
                  <Button
                    type="submit"
                    size="lg"
                    className={cn(
                      "w-full relative overflow-hidden font-semibold text-lg py-6",
                      "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
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
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {validPlayerCount < 3 ? `Legg til ${3 - validPlayerCount} flere spiller(e)` : "Klar til å starte!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
