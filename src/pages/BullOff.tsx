import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Circle, ArrowLeft, Play, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type GameVariant = "classic" | "bestof";

interface Player {
  name: string;
  score: number;
}

const BullOff = () => {
  const [gameState, setGameState] = useState<"setup" | "playing" | "finished">("setup");
  const [variant, setVariant] = useState<GameVariant>("classic");
  const [rounds, setRounds] = useState(5);
  const [targetScore, setTargetScore] = useState(250);
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [players, setPlayers] = useState<[Player, Player]>([
    { name: "", score: 0 },
    { name: "", score: 0 },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [dartsThrown, setDartsThrown] = useState(0);

  const startGame = () => {
    if (!player1Name.trim() || !player2Name.trim()) return;
    setPlayers([
      { name: player1Name.trim(), score: 0 },
      { name: player2Name.trim(), score: 0 },
    ]);
    setGameState("playing");
  };

  const addScore = (points: number) => {
    const newPlayers = [...players] as [Player, Player];
    newPlayers[currentPlayer].score += points;
    setPlayers(newPlayers);
    
    const newDartsThrown = dartsThrown + 1;
    setDartsThrown(newDartsThrown);

    // Check win condition for "Best of" variant
    if (variant === "bestof" && newPlayers[currentPlayer].score >= targetScore) {
      setGameState("finished");
      return;
    }

    // After 3 darts, switch player
    if (newDartsThrown >= 3) {
      setDartsThrown(0);
      if (currentPlayer === 1) {
        // Both players have thrown, check if round is complete
        if (variant === "classic" && currentRound >= rounds) {
          setGameState("finished");
          return;
        }
        setCurrentRound(currentRound + 1);
        setCurrentPlayer(0);
      } else {
        setCurrentPlayer(1);
      }
    }
  };

  const resetGame = () => {
    setGameState("setup");
    setPlayers([{ name: "", score: 0 }, { name: "", score: 0 }]);
    setCurrentPlayer(0);
    setCurrentRound(1);
    setDartsThrown(0);
  };

  const getWinner = () => {
    if (players[0].score > players[1].score) return players[0];
    if (players[1].score > players[0].score) return players[1];
    return null; // Draw
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Circle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl">Bull Off</h1>
                <p className="text-muted-foreground text-sm">1v1 bull-duell</p>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Button>
            </Link>
          </div>

          {gameState === "setup" && (
            <Card className="border-red-500/20 bg-gradient-to-br from-card via-card to-red-500/5">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
              <CardContent className="pt-6 space-y-6">
                {/* Rules */}
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    Regler
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong className="text-foreground">Inner Bull (Bullseye):</strong> 50 poeng</li>
                    <li>• <strong className="text-foreground">Outer Bull:</strong> 25 poeng</li>
                    <li>• <strong className="text-foreground">Alt annet:</strong> 0 poeng</li>
                    <li>• Hver spiller kaster 3 piler per runde</li>
                  </ul>
                </div>

                {/* Game variant */}
                <div className="space-y-3">
                  <Label>Spillvariant</Label>
                  <RadioGroup 
                    value={variant} 
                    onValueChange={(v) => setVariant(v as GameVariant)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div>
                      <RadioGroupItem value="classic" id="classic" className="peer sr-only" />
                      <Label
                        htmlFor="classic"
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all",
                          "border-2 bg-muted/30 hover:bg-muted/50",
                          "peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/10"
                        )}
                      >
                        <Trophy className="w-6 h-6 text-red-500 mb-2" />
                        <span className="font-medium">Klassisk</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Høyest poengsum over X runder
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="bestof" id="bestof" className="peer sr-only" />
                      <Label
                        htmlFor="bestof"
                        className={cn(
                          "flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all",
                          "border-2 bg-muted/30 hover:bg-muted/50",
                          "peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/10"
                        )}
                      >
                        <Flame className="w-6 h-6 text-red-500 mb-2" />
                        <span className="font-medium">Best of Bull</span>
                        <span className="text-xs text-muted-foreground text-center mt-1">
                          Først til X poeng vinner
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Variant settings */}
                {variant === "classic" ? (
                  <div className="space-y-2">
                    <Label>Antall runder</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                      className="bg-muted/50"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Poeng for å vinne</Label>
                    <Input
                      type="number"
                      min={50}
                      max={1000}
                      step={50}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="bg-muted/50"
                    />
                  </div>
                )}

                {/* Players */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Spiller 1</Label>
                    <Input
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="Navn"
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Spiller 2</Label>
                    <Input
                      value={player2Name}
                      onChange={(e) => setPlayer2Name(e.target.value)}
                      placeholder="Navn"
                      className="bg-muted/50"
                    />
                  </div>
                </div>

                <Button 
                  onClick={startGame} 
                  className="w-full bg-red-500 hover:bg-red-600"
                  disabled={!player1Name.trim() || !player2Name.trim()}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start spill
                </Button>
              </CardContent>
            </Card>
          )}

          {gameState === "playing" && (
            <div className="space-y-6">
              {/* Score display */}
              <div className="grid grid-cols-2 gap-4">
                {players.map((player, idx) => (
                  <Card 
                    key={idx}
                    className={cn(
                      "transition-all",
                      currentPlayer === idx && "ring-2 ring-red-500 shadow-lg shadow-red-500/20"
                    )}
                  >
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground mb-1">{player.name}</p>
                      <p className="font-display text-4xl text-foreground">{player.score}</p>
                      {currentPlayer === idx && (
                        <p className="text-xs text-red-500 mt-2">
                          Pil {dartsThrown + 1} av 3
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Round info */}
              <div className="text-center">
                {variant === "classic" ? (
                  <p className="text-muted-foreground">
                    Runde <span className="text-foreground font-semibold">{currentRound}</span> av {rounds}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Først til <span className="text-foreground font-semibold">{targetScore}</span> poeng
                  </p>
                )}
              </div>

              {/* Scoring buttons */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    Hvor traff <span className="text-foreground font-medium">{players[currentPlayer].name}</span>?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => addScore(50)}
                      className="h-20 bg-red-500 hover:bg-red-600 flex flex-col"
                    >
                      <Circle className="w-6 h-6 mb-1 fill-current" />
                      <span className="text-lg font-bold">50</span>
                      <span className="text-xs opacity-75">Inner Bull</span>
                    </Button>
                    <Button
                      onClick={() => addScore(25)}
                      className="h-20 bg-red-400 hover:bg-red-500 flex flex-col"
                    >
                      <Circle className="w-6 h-6 mb-1" />
                      <span className="text-lg font-bold">25</span>
                      <span className="text-xs opacity-75">Outer Bull</span>
                    </Button>
                    <Button
                      onClick={() => addScore(0)}
                      variant="outline"
                      className="h-20 flex flex-col"
                    >
                      <span className="text-2xl mb-1">✕</span>
                      <span className="text-lg font-bold">0</span>
                      <span className="text-xs opacity-75">Bom</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={resetGame} className="w-full">
                Avbryt spill
              </Button>
            </div>
          )}

          {gameState === "finished" && (
            <Card className="border-red-500/20">
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                <div>
                  <p className="text-muted-foreground mb-2">Vinner</p>
                  <h2 className="font-display text-4xl">
                    {getWinner()?.name || "Uavgjort!"}
                  </h2>
                  {getWinner() && (
                    <p className="text-2xl text-red-500 font-bold mt-2">
                      {getWinner()?.score} poeng
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  {players.map((player, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-sm text-muted-foreground">{player.name}</p>
                      <p className="text-2xl font-bold">{player.score}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={resetGame} variant="outline" className="flex-1">
                    Nytt spill
                  </Button>
                  <Link to="/" className="flex-1">
                    <Button className="w-full bg-red-500 hover:bg-red-600">
                      Tilbake til meny
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AppLayout>
  );
};

export default BullOff;
