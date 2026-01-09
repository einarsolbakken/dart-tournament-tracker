import { useState, useCallback, useEffect } from "react";
import { DartBoard } from "./DartBoard";
import { Button } from "@/components/ui/button";
import { Match, Player } from "@/hooks/useTournaments";
import { Trophy, Undo2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MatchResult {
  winnerId: string;
  loserId: string;
  winnerName: string;
  player1Sets: number;
  player2Sets: number;
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
  const [throwHistory, setThrowHistory] = useState<{ throw: ThrowRecord; player: 1 | 2; prevScore: number; prevDarts: number; prevSets: number }[]>([]);
  const [showBust, setShowBust] = useState(false);
  const [showSetWin, setShowSetWin] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [setNumber, setSetNumber] = useState(1); // Track which set we're on for alternating starts

  const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
  const currentPlayerName = currentPlayer === 1 ? player1?.name : player2?.name;

  const handleScore = useCallback((score: number, multiplier: number) => {
    if (currentThrows.length >= 3 || matchResult) return;

    const points = score * multiplier;
    const newScore = currentPlayerScore - points;

    // Check for bust - in single checkout mode, score of 0 is valid, in double checkout need to check
    const isBust = newScore < 0 || 
      (!requireDoubleOut && newScore < 0) || 
      (requireDoubleOut && newScore === 1);

    if (isBust) {
      // Show big BUST overlay - longer duration
      setShowBust(true);
      setTimeout(() => setShowBust(false), 2500);
      
      // Reset score to before this round and switch player
      if (currentPlayer === 1) {
        setPlayer1Score(player1Score + roundScore);
        setPlayer1Darts(player1Darts - currentThrows.length);
      } else {
        setPlayer2Score(player2Score + roundScore);
        setPlayer2Darts(player2Darts - currentThrows.length);
      }
      setTimeout(() => switchPlayer(), 300);
      return;
    }

    // Check checkout rules
    if (newScore === 0) {
      if (requireDoubleOut && multiplier !== 2 && score !== 50) {
        // Show bust for invalid checkout
        setShowBust(true);
        setTimeout(() => setShowBust(false), 2500);
        return;
      }
    }

    const newThrow: ThrowRecord = { score, multiplier };
    const newThrows = [...currentThrows, newThrow];
    setCurrentThrows(newThrows);
    setRoundScore(roundScore + points);

    // Save to history for undo
    const historyEntry = {
      throw: newThrow,
      player: currentPlayer,
      prevScore: currentPlayer === 1 ? player1Score : player2Score,
      prevDarts: currentPlayer === 1 ? player1Darts : player2Darts,
      prevSets: currentPlayer === 1 ? player1Sets : player2Sets,
    };
    setThrowHistory([...throwHistory, historyEntry]);

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
  }, [currentThrows, currentPlayerScore, currentPlayer, roundScore, player1Darts, player2Darts, player1Score, player2Score, requireDoubleOut, matchResult]);

  const handleSetWin = () => {
    if (currentPlayer === 1) {
      const newSets = player1Sets + 1;
      setPlayer1Sets(newSets);
      
      if (newSets >= setsToWin) {
        // Show match win overlay instead of auto-completing
        setMatchResult({
          winnerId: match.player1_id!,
          loserId: match.player2_id!,
          winnerName: player1?.name || "Spiller 1",
          player1Sets: newSets,
          player2Sets,
        });
        return;
      }
      
      // Show set win overlay
      setShowSetWin(`${player1?.name} vinner set ${setNumber}!`);
      setTimeout(() => setShowSetWin(null), 2000);
    } else {
      const newSets = player2Sets + 1;
      setPlayer2Sets(newSets);
      
      if (newSets >= setsToWin) {
        // Show match win overlay instead of auto-completing
        setMatchResult({
          winnerId: match.player2_id!,
          loserId: match.player1_id!,
          winnerName: player2?.name || "Spiller 2",
          player1Sets,
          player2Sets: newSets,
        });
        return;
      }
      
      // Show set win overlay
      setShowSetWin(`${player2?.name} vinner set ${setNumber}!`);
      setTimeout(() => setShowSetWin(null), 2000);
    }

    // Reset for next set with alternating starting player
    resetSet();
  };

  const confirmMatchResult = () => {
    if (!matchResult) return;
    onComplete(matchResult.winnerId, matchResult.loserId, matchResult.player1Sets, matchResult.player2Sets);
  };

  const resetSet = () => {
    const nextSetNumber = setNumber + 1;
    setSetNumber(nextSetNumber);
    
    setPlayer1Score(startingScore);
    setPlayer2Score(startingScore);
    setCurrentThrows([]);
    setRoundScore(0);
    
    // Reset darts for new set
    setPlayer1Darts(0);
    setPlayer2Darts(0);
    
    // Alternate starting player based on set number
    // Set 1: Player 1, Set 2: Player 2, Set 3: Player 1, etc.
    setCurrentPlayer(nextSetNumber % 2 === 1 ? 1 : 2);
  };

  const switchPlayer = () => {
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setCurrentThrows([]);
    setRoundScore(0);
  };

  const undoLastThrow = () => {
    if (throwHistory.length === 0) return;

    // If match was won, clear the result to allow undo
    if (matchResult) {
      setMatchResult(null);
    }

    const lastEntry = throwHistory[throwHistory.length - 1];

    // Remove from history
    setThrowHistory(throwHistory.slice(0, -1));

    // Restore state for the player who made the throw
    if (lastEntry.player === 1) {
      setPlayer1Score(lastEntry.prevScore);
      setPlayer1Darts(lastEntry.prevDarts);
      setPlayer1Sets(lastEntry.prevSets);
    } else {
      setPlayer2Score(lastEntry.prevScore);
      setPlayer2Darts(lastEntry.prevDarts);
      setPlayer2Sets(lastEntry.prevSets);
    }

    // If it was current player's throw, update current throws
    if (lastEntry.player === currentPlayer) {
      setCurrentThrows(currentThrows.slice(0, -1));
      setRoundScore(Math.max(0, roundScore - lastEntry.throw.score * lastEntry.throw.multiplier));
    } else {
      // Switch back to the player who made the throw
      setCurrentPlayer(lastEntry.player);
      // Reconstruct their throws from history
      const playerThrows = throwHistory
        .slice(0, -1)
        .filter(h => h.player === lastEntry.player)
        .slice(-2)
        .map(h => h.throw);
      setCurrentThrows(playerThrows);
      const playerRoundScore = playerThrows.reduce((sum, t) => sum + t.score * t.multiplier, 0);
      setRoundScore(playerRoundScore);
    }
  };

  const formatThrow = (t: ThrowRecord) => {
    if (t.score === 0) return "Miss";
    if (t.multiplier === 2) return `D${t.score}`;
    if (t.multiplier === 3) return `T${t.score}`;
    return `${t.score}`;
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* BUST Overlay */}
      {showBust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
          <div className="text-8xl md:text-[12rem] font-display font-bold text-destructive animate-in zoom-in-50 duration-300 tracking-wider">
            BUST!
          </div>
        </div>
      )}

      {/* Set Win Overlay */}
      {showSetWin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200">
          <div className="text-4xl md:text-6xl font-display font-bold text-accent animate-in zoom-in-75 duration-300 text-center px-4">
            🎯 {showSetWin}
          </div>
        </div>
      )}

      {/* Match Win Overlay with Confirm Button */}
      {matchResult && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 animate-in fade-in duration-200">
          <div className="text-center space-y-8">
            <div className="text-6xl md:text-8xl font-display font-bold text-primary animate-in zoom-in-50 duration-500">
              🏆
            </div>
            <div className="text-4xl md:text-7xl font-display font-bold text-primary animate-in slide-in-from-bottom duration-500">
              {matchResult.winnerName}
            </div>
            <div className="text-2xl md:text-4xl text-muted-foreground animate-in fade-in duration-700">
              vinner kampen!
            </div>
            <div className="text-xl md:text-2xl text-muted-foreground">
              {matchResult.player1Sets} - {matchResult.player2Sets}
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={undoLastThrow}
                className="text-lg px-6 py-4"
              >
                <Undo2 className="w-5 h-5 mr-2" />
                Angre siste kast
              </Button>
              <Button
                size="lg"
                onClick={confirmMatchResult}
                className="text-lg px-8 py-4 bg-primary hover:bg-primary/90"
              >
                <Check className="w-5 h-5 mr-2" />
                Bekreft resultat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Kampinfo */}
      <div className="text-center text-sm text-muted-foreground mb-6">
        <span className="bg-muted px-4 py-2 rounded-full text-base">
          {stage === "group" ? "Gruppespill" : "Sluttspill"} • 301 • 
          {requireDoubleOut ? " Dobbel checkout" : " Single checkout"} • 
          Først til {setsToWin} • Set {setNumber}
        </span>
      </div>

      {/* Side-by-side layout - MUCH LARGER */}
      <div className="flex flex-col xl:flex-row gap-8 items-stretch">
        {/* Left side: Scores */}
        <div className="xl:w-1/2 space-y-6">
          {/* Scoreboard */}
          <div className="grid grid-cols-2 gap-6">
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
          <div className="bg-muted rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base text-muted-foreground">
                {currentPlayerName}'s tur
              </span>
              <span className="font-bold text-3xl text-accent">+{roundScore}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-20 rounded-lg flex items-center justify-center font-bold text-2xl",
                    currentThrows[i]
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border-2 border-border"
                  )}
                >
                  {currentThrows[i] ? formatThrow(currentThrows[i]) : "-"}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={undoLastThrow}
                disabled={throwHistory.length === 0}
                className="text-base"
              >
                <Undo2 className="w-5 h-5 mr-2" />
                Angre
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={switchPlayer}
                className="ml-auto text-base"
              >
                Neste spiller
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right side: Dartboard */}
        <div className="xl:w-1/2 flex items-center justify-center">
          <DartBoard
            onScore={handleScore}
            disabled={currentThrows.length >= 3 || !!matchResult}
          />
        </div>
      </div>
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
        "rounded-xl p-6 transition-all",
        isActive
          ? "bg-primary/20 border-3 border-primary shadow-lg"
          : "bg-card border-2 border-border"
      )}
    >
      <div className="text-lg text-muted-foreground mb-2 truncate font-medium">{name}</div>
      <div className={cn(
        "text-6xl xl:text-7xl font-display",
        isActive && "text-primary"
      )}>
        {score}
      </div>
      <div className="flex items-center justify-between mt-4 text-base">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="text-lg font-semibold">{sets}/{setsToWin}</span>
        </div>
        <div className="text-muted-foreground text-lg">
          {darts} 🎯
        </div>
      </div>
    </div>
  );
}