import { useState, useCallback } from "react";
import { DartBoard } from "./DartBoard";
import { Button } from "@/components/ui/button";
import { Match, Player, useUpdateMatch } from "@/hooks/useTournaments";
import { Trophy, Undo2, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MatchScoringProps {
  match: Match;
  players: Player[];
  tournamentId: string;
  gameMode: string;
  onComplete: () => void;
}

interface ThrowRecord {
  score: number;
  multiplier: number;
}

export function MatchScoring({
  match,
  players,
  tournamentId,
  gameMode,
  onComplete,
}: MatchScoringProps) {
  const startingScore = gameMode === "501" ? 501 : 201;
  const updateMatch = useUpdateMatch();
  
  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);

  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(startingScore);
  const [player2Score, setPlayer2Score] = useState(startingScore);
  const [player1Darts, setPlayer1Darts] = useState(0);
  const [player2Darts, setPlayer2Darts] = useState(0);
  const [player1Legs, setPlayer1Legs] = useState(0);
  const [player2Legs, setPlayer2Legs] = useState(0);
  const [currentThrows, setCurrentThrows] = useState<ThrowRecord[]>([]);
  const [roundScore, setRoundScore] = useState(0);

  const legsToWin = 3; // Best of 5

  const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
  const currentPlayerName = currentPlayer === 1 ? player1?.name : player2?.name;

  const handleScore = useCallback((score: number, multiplier: number) => {
    if (currentThrows.length >= 3) return;

    const points = score * multiplier;
    const newScore = currentPlayerScore - points;

    // Check for bust (going below 0 or to 1, or hitting 0 without double)
    if (newScore < 0 || newScore === 1) {
      toast.error("Bust! For høy score");
      return;
    }

    // Must finish on a double (or bullseye)
    if (newScore === 0 && multiplier !== 2 && score !== 50) {
      toast.error("Må avslutte på dobbel!");
      return;
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

    // Check for leg win
    if (newScore === 0) {
      handleLegWin();
      return;
    }

    // Auto-switch after 3 darts
    if (newThrows.length >= 3) {
      setTimeout(() => switchPlayer(), 500);
    }
  }, [currentThrows, currentPlayerScore, currentPlayer, roundScore, player1Darts, player2Darts]);

  const handleLegWin = () => {
    if (currentPlayer === 1) {
      const newLegs = player1Legs + 1;
      setPlayer1Legs(newLegs);
      
      if (newLegs >= legsToWin) {
        handleMatchWin(1);
        return;
      }
    } else {
      const newLegs = player2Legs + 1;
      setPlayer2Legs(newLegs);
      
      if (newLegs >= legsToWin) {
        handleMatchWin(2);
        return;
      }
    }

    // Reset for next leg
    toast.success(`${currentPlayerName} vinner legget!`);
    resetLeg();
  };

  const handleMatchWin = async (winner: 1 | 2) => {
    const winnerId = winner === 1 ? match.player1_id : match.player2_id;
    if (!winnerId) return;

    toast.success(`🎯 ${winner === 1 ? player1?.name : player2?.name} vinner kampen!`);

    await updateMatch.mutateAsync({
      matchId: match.id,
      winnerId,
      player1Score: player1Legs + (winner === 1 ? 1 : 0),
      player2Score: player2Legs + (winner === 2 ? 1 : 0),
      tournamentId,
    });

    onComplete();
  };

  const resetLeg = () => {
    setPlayer1Score(startingScore);
    setPlayer2Score(startingScore);
    setCurrentThrows([]);
    setRoundScore(0);
    // Winner of leg starts next
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
      {/* Scoreboard */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerScoreCard
          name={player1?.name || "Spiller 1"}
          score={player1Score}
          legs={player1Legs}
          darts={player1Darts}
          isActive={currentPlayer === 1}
          legsToWin={legsToWin}
        />
        <PlayerScoreCard
          name={player2?.name || "Spiller 2"}
          score={player2Score}
          legs={player2Legs}
          darts={player2Darts}
          isActive={currentPlayer === 2}
          legsToWin={legsToWin}
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
  legs,
  darts,
  isActive,
  legsToWin,
}: {
  name: string;
  score: number;
  legs: number;
  darts: number;
  isActive: boolean;
  legsToWin: number;
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
          <span>{legs}/{legsToWin}</span>
        </div>
        <div className="text-muted-foreground">
          {darts} 🎯
        </div>
      </div>
    </div>
  );
}
