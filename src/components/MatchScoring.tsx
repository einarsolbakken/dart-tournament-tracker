import { useState, useCallback } from "react";
import { DartBoard } from "./DartBoard";
import { Button } from "@/components/ui/button";
import { Match, Player } from "@/hooks/useTournaments";
import { Trophy, Undo2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MatchScoringProps {
  match: Match;
  players: Player[];
  tournamentId: string;
  stage: "group" | "knockout";
  onComplete: (winnerId: string, loserId: string, player1Sets: number, player2Sets: number) => void;
}

interface ThrowRecord {
  score: number;
  multiplier: number;
}

export function MatchScoring({
  match,
  players,
  tournamentId,
  stage,
  onComplete,
}: MatchScoringProps) {
  const startingScore = 301;
  const setsToWin = stage === "group" ? 2 : 3; // First to 2 in group, first to 3 in knockout
  const requireDoubleOut = stage === "knockout"; // Single checkout in group, double in knockout
  
  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);

  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(startingScore);
  const [player2Score, setPlayer2Score] = useState(startingScore);
  const [player1Darts, setPlayer1Darts] = useState(0);
  const [player2Darts, setPlayer2Darts] = useState(0);
  const [player1Sets, setPlayer1Sets] = useState(0);
  const [player2Sets, setPlayer2Sets] = useState(0);
  const [currentThrows, setCurrentThrows] = useState<ThrowRecord[]>([]);
  const [roundScore, setRoundScore] = useState(0);

  const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
  const currentPlayerName = currentPlayer === 1 ? player1?.name : player2?.name;

  const handleScore = useCallback((score: number, multiplier: number) => {
    if (currentThrows.length >= 3) return;

    const points = score * multiplier;
    const newScore = currentPlayerScore - points;

    // Check for bust
    if (newScore < 0 || newScore === 1) {
      toast.error("Bust! For høy score");
      return;
    }

    // Check checkout rules
    if (newScore === 0) {
      if (requireDoubleOut && multiplier !== 2 && score !== 50) {
        toast.error("Må avslutte på dobbel!");
        return;
      }
    }

    const newThrow: ThrowRecord = { score, multiplier };
    const newThrows = [...currentThrows, newThrow];
    setCurrentThrows(newThrows);
    setRoundScore(roundScore + points);

    // Update score
    if (currentPlayer === 1) {
      setPlayer1Score(newScore);
      setPlayer1Darts(player1Darts + 1);
    } else {
      setPlayer2Score(newScore);
      setPlayer2Darts(player2Darts + 1);
    }

    // Check for set win
    if (newScore === 0) {
      handleSetWin();
      return;
    }

    // Auto-switch after 3 darts
    if (newThrows.length >= 3) {
      setTimeout(() => switchPlayer(), 500);
    }
  }, [currentThrows, currentPlayerScore, currentPlayer, roundScore, player1Darts, player2Darts, requireDoubleOut]);

  const handleSetWin = () => {
    if (currentPlayer === 1) {
      const newSets = player1Sets + 1;
      setPlayer1Sets(newSets);
      
      if (newSets >= setsToWin) {
        handleMatchWin(1);
        return;
      }
    } else {
      const newSets = player2Sets + 1;
      setPlayer2Sets(newSets);
      
      if (newSets >= setsToWin) {
        handleMatchWin(2);
        return;
      }
    }

    // Reset for next set
    toast.success(`${currentPlayerName} vinner settet!`);
    resetSet();
  };

  const handleMatchWin = (winner: 1 | 2) => {
    const winnerId = winner === 1 ? match.player1_id : match.player2_id;
    const loserId = winner === 1 ? match.player2_id : match.player1_id;
    
    if (!winnerId || !loserId) return;

    toast.success(`🎯 ${winner === 1 ? player1?.name : player2?.name} vinner kampen!`);

    const finalP1Sets = player1Sets + (winner === 1 ? 1 : 0);
    const finalP2Sets = player2Sets + (winner === 2 ? 1 : 0);

    onComplete(winnerId, loserId, finalP1Sets, finalP2Sets);
  };

  const resetSet = () => {
    setPlayer1Score(startingScore);
    setPlayer2Score(startingScore);
    setCurrentThrows([]);
    setRoundScore(0);
  };

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentThrows([]);
    setRoundScore(0);
  };

  const undoLastThrow = () => {
    if (currentThrows.length === 0) return;

    const lastThrow = currentThrows[currentThrows.length - 1];
    const points = lastThrow.score * lastThrow.multiplier;

    setCurrentThrows(currentThrows.slice(0, -1));
    setRoundScore(roundScore - points);

    if (currentPlayer === 1) {
      setPlayer1Score(player1Score + points);
      setPlayer1Darts(Math.max(0, player1Darts - 1));
    } else {
      setPlayer2Score(player2Score + points);
      setPlayer2Darts(Math.max(0, player2Darts - 1));
    }
  };

  const formatThrow = (t: ThrowRecord) => {
    if (t.score === 0) return "Miss";
    if (t.multiplier === 2) return `D${t.score}`;
    if (t.multiplier === 3) return `T${t.score}`;
    return `${t.score}`;
  };

  return (
    <div className="space-y-6">
      {/* Match info */}
      <div className="text-center text-sm text-muted-foreground">
        <span className="bg-muted px-3 py-1 rounded-full">
          {stage === "group" ? "Gruppespill" : "Sluttspill"} • 301 • 
          {requireDoubleOut ? " Dobbel checkout" : " Single checkout"} • 
          First to {setsToWin}
        </span>
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerScoreCard
          name={player1?.name || "Spiller 1"}
          score={player1Score}
          sets={player1Sets}
          darts={player1Darts}
          isActive={currentPlayer === 1}
          setsToWin={setsToWin}
        />
        <PlayerScoreCard
          name={player2?.name || "Spiller 2"}
          score={player2Score}
          sets={player2Sets}
          darts={player2Darts}
          isActive={currentPlayer === 2}
          setsToWin={setsToWin}
        />
      </div>

      {/* Current round */}
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {currentPlayerName}'s tur
          </span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-accent">+{roundScore}</span>
            <span className="text-muted-foreground">
              ({3 - currentThrows.length} piler igjen)
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-12 rounded-md flex items-center justify-center font-bold text-lg",
                currentThrows[i]
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border"
              )}
            >
              {currentThrows[i] ? formatThrow(currentThrows[i]) : "-"}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undoLastThrow}
            disabled={currentThrows.length === 0}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            Angre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={switchPlayer}
            disabled={currentThrows.length === 0}
            className="ml-auto"
          >
            Neste spiller
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dartboard */}
      <DartBoard
        onScore={handleScore}
        disabled={currentThrows.length >= 3}
      />
    </div>
  );
}

function PlayerScoreCard({
  name,
  score,
  sets,
  darts,
  isActive,
  setsToWin,
}: {
  name: string;
  score: number;
  sets: number;
  darts: number;
  isActive: boolean;
  setsToWin: number;
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-4 transition-all",
        isActive
          ? "bg-primary/20 border-2 border-primary"
          : "bg-card border border-border"
      )}
    >
      <div className="text-sm text-muted-foreground mb-1 truncate">{name}</div>
      <div className={cn(
        "text-4xl font-display",
        isActive && "text-primary"
      )}>
        {score}
      </div>
      <div className="flex items-center justify-between mt-2 text-sm">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-accent" />
          <span>{sets}/{setsToWin}</span>
        </div>
        <div className="text-muted-foreground">
          {darts} 🎯
        </div>
      </div>
    </div>
  );
}
