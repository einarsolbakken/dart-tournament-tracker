import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, Users, LayoutGrid, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryFlagPicker } from "@/components/CountryFlagPicker";
import { generateGroups, calculateAdvancingPlayers } from "@/lib/groupGenerator";
import { getValidMatchesPerPlayerOptions, getLeagueKnockoutSize, validateLeagueConfig } from "@/lib/leagueGenerator";

interface PlayersStepProps {
  playerNames: string[];
  playerCountries: string[];
  addPlayer: () => void;
  removePlayer: (index: number) => void;
  updatePlayerName: (index: number, value: string) => void;
  updatePlayerCountry: (index: number, value: string) => void;
  hasDuplicates: boolean;
  duplicateNames: Set<string>;
  validPlayerCount: number;
  tournamentFormat: "group" | "league";
  matchesPerPlayer: number;
  setMatchesPerPlayer: (value: number) => void;
}

export function PlayersStep({
  playerNames,
  playerCountries,
  addPlayer,
  removePlayer,
  updatePlayerName,
  updatePlayerCountry,
  hasDuplicates,
  duplicateNames,
  validPlayerCount,
  tournamentFormat,
  matchesPerPlayer,
  setMatchesPerPlayer,
}: PlayersStepProps) {
  // Calculate group info for preview
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

  // Calculate league info for preview
  const getLeaguePreview = () => {
    if (tournamentFormat !== "league" || validPlayerCount < 2) return null;
    
    const config = validateLeagueConfig(validPlayerCount, matchesPerPlayer);
    const knockoutSize = getLeagueKnockoutSize(validPlayerCount);
    const validOptions = getValidMatchesPerPlayerOptions(validPlayerCount);
    
    return { ...config, knockoutSize, validOptions };
  };

  const groupPreview = getGroupPreview();
  const leaguePreview = getLeaguePreview();

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Spillere</h2>
        <p className="text-muted-foreground">Legg til alle som skal delta</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          <span className="font-semibold">Deltakere</span>
          <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent text-sm font-bold">
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
      
      <div className="space-y-3 max-h-[40vh] overflow-y-auto overflow-x-hidden p-1 -m-1 scrollbar-thin">
        {playerNames.map((playerName, index) => (
          <div 
            key={index} 
            className="flex gap-2 group animate-in fade-in slide-in-from-right-2 duration-200"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="w-7 h-11 flex items-center justify-center text-sm text-muted-foreground font-medium shrink-0">
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
                  "flex-1 h-11 bg-muted/30 border-border/50 transition-all rounded-r-none border-r-0",
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
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 h-11 w-11"
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

      {/* Group Preview */}
      {groupPreview && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
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
        </div>
      )}

      {/* League Preview */}
      {leaguePreview && (
        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Kamper per spiller
          </h4>
          <Select 
            value={matchesPerPlayer.toString()} 
            onValueChange={(v) => setMatchesPerPlayer(parseInt(v))}
          >
            <SelectTrigger className="w-full bg-background border-border/50">
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
        </div>
      )}
    </div>
  );
}
