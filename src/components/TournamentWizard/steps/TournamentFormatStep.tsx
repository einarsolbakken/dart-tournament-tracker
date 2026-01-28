import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trophy, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

type TournamentFormat = "group" | "league";

interface TournamentFormatStepProps {
  tournamentFormat: TournamentFormat;
  setTournamentFormat: (format: TournamentFormat) => void;
}

export function TournamentFormatStep({ tournamentFormat, setTournamentFormat }: TournamentFormatStepProps) {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Turneringsformat</h2>
        <p className="text-muted-foreground">Velg hvordan turneringen skal organiseres</p>
      </div>

      <RadioGroup 
        value={tournamentFormat} 
        onValueChange={(value) => setTournamentFormat(value as TournamentFormat)}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        <div className="relative group">
          <RadioGroupItem value="group" id="format-group" className="peer sr-only" />
          <Label 
            htmlFor="format-group" 
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all duration-300",
              "border-2 bg-muted/30 hover:bg-muted/50",
              "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/15",
              "peer-data-[state=checked]:shadow-xl peer-data-[state=checked]:shadow-primary/25",
              "group-hover:scale-[1.02]"
            )}
          >
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all",
              "bg-muted/50 group-hover:bg-primary/20",
              tournamentFormat === "group" && "bg-primary/30"
            )}>
              <LayoutGrid className="w-10 h-10 text-primary" />
            </div>
            <span className="font-bold text-xl">Gruppespill</span>
            <span className="text-sm text-muted-foreground text-center mt-2 max-w-[180px]">
              Spillerne deles inn i grupper, deretter sluttspill
            </span>
          </Label>
        </div>
        
        <div className="relative group">
          <RadioGroupItem value="league" id="format-league" className="peer sr-only" />
          <Label 
            htmlFor="format-league" 
            className={cn(
              "flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer transition-all duration-300",
              "border-2 bg-muted/30 hover:bg-muted/50",
              "peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/15",
              "peer-data-[state=checked]:shadow-xl peer-data-[state=checked]:shadow-accent/25",
              "group-hover:scale-[1.02]"
            )}
          >
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all",
              "bg-muted/50 group-hover:bg-accent/20",
              tournamentFormat === "league" && "bg-accent/30"
            )}>
              <Trophy className="w-10 h-10 text-accent" />
            </div>
            <span className="font-bold text-xl">Ligasystem</span>
            <span className="text-sm text-muted-foreground text-center mt-2 max-w-[180px]">
              Alle spiller like mange kamper, deretter sluttspill
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
