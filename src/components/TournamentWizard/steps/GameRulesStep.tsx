import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface GameRulesStepProps {
  tournamentFormat: "group" | "league";
  gameMode: string;
  setGameMode: (mode: string) => void;
  groupSetsToWin: number;
  setGroupSetsToWin: (sets: number) => void;
  knockoutSetsToWin: number;
  setKnockoutSetsToWin: (sets: number) => void;
  groupCheckoutType: string;
  setGroupCheckoutType: (type: string) => void;
  knockoutCheckoutType: string;
  setKnockoutCheckoutType: (type: string) => void;
  showCheckoutSuggestions: boolean;
  setShowCheckoutSuggestions: (show: boolean) => void;
}

export function GameRulesStep({
  tournamentFormat,
  gameMode,
  setGameMode,
  groupSetsToWin,
  setGroupSetsToWin,
  knockoutSetsToWin,
  setKnockoutSetsToWin,
  groupCheckoutType,
  setGroupCheckoutType,
  knockoutCheckoutType,
  setKnockoutCheckoutType,
  showCheckoutSuggestions,
  setShowCheckoutSuggestions,
}: GameRulesStepProps) {
  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Spilleregler</h2>
        <p className="text-muted-foreground">Konfigurer reglene for kampene</p>
      </div>

      <div className="space-y-8">
        {/* Game Mode */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Spillmodus</Label>
          <div className="flex gap-3">
            {["201", "301", "501"].map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={gameMode === mode ? "default" : "outline"}
                size="lg"
                onClick={() => setGameMode(mode)}
                className={cn(
                  "flex-1 text-lg font-bold transition-all",
                  gameMode === mode && "shadow-lg scale-105"
                )}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        {/* Group/League Rules */}
        <div className="space-y-4 p-5 rounded-xl bg-muted/30 border border-border/50">
          <Label className="text-base font-semibold">
            {tournamentFormat === "group" ? "Gruppespill" : "Ligakamper"}
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Sets for å vinne</Label>
              <Select value={String(groupSetsToWin)} onValueChange={(v) => setGroupSetsToWin(Number(v))}>
                <SelectTrigger className="bg-background h-11">
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
              <Label className="text-sm text-muted-foreground">Checkout</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={groupCheckoutType === "single" ? "default" : "outline"}
                  onClick={() => setGroupCheckoutType("single")}
                  className="flex-1 h-11"
                >
                  Single
                </Button>
                <Button
                  type="button"
                  variant={groupCheckoutType === "double" ? "default" : "outline"}
                  onClick={() => setGroupCheckoutType("double")}
                  className="flex-1 h-11"
                >
                  Dobbel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Knockout Rules */}
        <div className="space-y-4 p-5 rounded-xl bg-muted/30 border border-border/50">
          <Label className="text-base font-semibold">Sluttspill</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Sets for å vinne</Label>
              <Select value={String(knockoutSetsToWin)} onValueChange={(v) => setKnockoutSetsToWin(Number(v))}>
                <SelectTrigger className="bg-background h-11">
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
              <Label className="text-sm text-muted-foreground">Checkout</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={knockoutCheckoutType === "single" ? "default" : "outline"}
                  onClick={() => setKnockoutCheckoutType("single")}
                  className="flex-1 h-11"
                >
                  Single
                </Button>
                <Button
                  type="button"
                  variant={knockoutCheckoutType === "double" ? "default" : "outline"}
                  onClick={() => setKnockoutCheckoutType("double")}
                  className="flex-1 h-11"
                >
                  Dobbel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Toggle */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Checkout-forslag</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={showCheckoutSuggestions ? "default" : "outline"}
              size="lg"
              onClick={() => setShowCheckoutSuggestions(true)}
              className={cn(
                "flex-1 transition-all",
                showCheckoutSuggestions && "shadow-lg"
              )}
            >
              På
            </Button>
            <Button
              type="button"
              variant={!showCheckoutSuggestions ? "default" : "outline"}
              size="lg"
              onClick={() => setShowCheckoutSuggestions(false)}
              className={cn(
                "flex-1 transition-all",
                !showCheckoutSuggestions && "shadow-lg"
              )}
            >
              Av
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Vis checkout-forslag under kamper for å hjelpe spillerne
          </p>
        </div>
      </div>
    </div>
  );
}
