import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateTournament } from "@/hooks/useTournaments";
import { ArrowLeft, ArrowRight, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StepIndicator } from "./StepIndicator";
import { TournamentInfoStep } from "./steps/TournamentInfoStep";
import { TournamentFormatStep } from "./steps/TournamentFormatStep";
import { GameRulesStep } from "./steps/GameRulesStep";
import { PlayersStep } from "./steps/PlayersStep";
import { cn } from "@/lib/utils";

type TournamentFormat = "group" | "league";

const STEPS = [
  { number: 1, label: "Info" },
  { number: 2, label: "Format" },
  { number: 3, label: "Regler" },
  { number: 4, label: "Spillere" },
];

export function CreateTournamentWizard() {
  const navigate = useNavigate();
  const createTournament = useCreateTournament();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"left" | "right">("right");
  
  // Form state
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
  const [showCheckoutSuggestions, setShowCheckoutSuggestions] = useState<boolean>(true);

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
  
  // Check for duplicate names
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

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        const minPlayers = tournamentFormat === "group" ? 3 : 2;
        return validPlayerCount >= minPlayers && !hasDuplicates;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < 4 && canGoNext()) {
      setDirection("right");
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setDirection("left");
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection("left");
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
    const validPlayers = playerNames.filter((n) => n.trim());
    
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
      const validCountries = playerNames
        .map((n, i) => n.trim() ? playerCountries[i] : null)
        .filter((_, i) => playerNames[i].trim());
      
      const tournament = await createTournament.mutateAsync({
        name,
        date: format(date, "yyyy-MM-dd"),
        playerNames: validPlayers,
        playerCountries: validCountries,
        format: tournamentFormat,
        matchesPerPlayer: tournamentFormat === "league" ? matchesPerPlayer : undefined,
        gameMode,
        groupSetsToWin,
        knockoutSetsToWin,
        groupCheckoutType,
        knockoutCheckoutType,
        showCheckoutSuggestions,
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

  const renderCurrentStep = () => {
    const baseClasses = cn(
      "animate-fade-in",
      direction === "right" ? "animate-slide-in-right" : "animate-slide-in-left"
    );

    switch (currentStep) {
      case 1:
        return (
          <div key="step-1" className={baseClasses}>
            <TournamentInfoStep
              name={name}
              setName={setName}
              date={date}
              setDate={setDate}
            />
          </div>
        );
      case 2:
        return (
          <div key="step-2" className={baseClasses}>
            <TournamentFormatStep
              tournamentFormat={tournamentFormat}
              setTournamentFormat={setTournamentFormat}
            />
          </div>
        );
      case 3:
        return (
          <div key="step-3" className={baseClasses}>
            <GameRulesStep
              tournamentFormat={tournamentFormat}
              gameMode={gameMode}
              setGameMode={setGameMode}
              groupSetsToWin={groupSetsToWin}
              setGroupSetsToWin={setGroupSetsToWin}
              knockoutSetsToWin={knockoutSetsToWin}
              setKnockoutSetsToWin={setKnockoutSetsToWin}
              groupCheckoutType={groupCheckoutType}
              setGroupCheckoutType={setGroupCheckoutType}
              knockoutCheckoutType={knockoutCheckoutType}
              setKnockoutCheckoutType={setKnockoutCheckoutType}
            />
          </div>
        );
      case 4:
        return (
          <div key="step-4" className={baseClasses}>
            <PlayersStep
              playerNames={playerNames}
              playerCountries={playerCountries}
              addPlayer={addPlayer}
              removePlayer={removePlayer}
              updatePlayerName={updatePlayerName}
              updatePlayerCountry={updatePlayerCountry}
              hasDuplicates={hasDuplicates}
              duplicateNames={duplicateNames}
              validPlayerCount={validPlayerCount}
              tournamentFormat={tournamentFormat}
              matchesPerPlayer={matchesPerPlayer}
              setMatchesPerPlayer={setMatchesPerPlayer}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full px-4 lg:px-8">
      {/* Header */}
      <div className="relative flex items-center justify-center mb-6">
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

      {/* Step Indicator */}
      <StepIndicator 
        steps={STEPS} 
        currentStep={currentStep} 
        onStepClick={goToStep}
      />

      {/* Step Content */}
      <Card className="relative overflow-hidden border-border/30 bg-card/80 shadow-xl mt-6">
        <CardContent className="pt-8 pb-8 min-h-[400px]">
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={goBack}
          disabled={currentStep === 1}
          className={cn(
            "gap-2 transition-all",
            currentStep === 1 && "opacity-0 pointer-events-none"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake
        </Button>

        {currentStep < 4 ? (
          <Button
            type="button"
            size="lg"
            onClick={goNext}
            disabled={!canGoNext()}
            className={cn(
              "gap-2 min-w-[140px] transition-all",
              "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            )}
          >
            Neste
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!canGoNext() || createTournament.isPending}
            className={cn(
              "gap-2 min-w-[160px] transition-all",
              "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
              "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
            )}
          >
            <Target className="w-5 h-5" />
            {createTournament.isPending ? "Oppretter..." : "Start Turnering"}
          </Button>
        )}
      </div>
    </div>
  );
}
