import { useState, useCallback, useRef, useEffect } from "react";
import { DartBoard } from "./DartBoard";
import { Button } from "@/components/ui/button";
import { Match, Player } from "@/hooks/useTournaments";
import { Trophy, Undo2, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckoutSuggestionDisplay } from "./CheckoutSuggestion";
import { getCheckoutSuggestion, doesThrowMatchSuggestion } from "@/lib/checkoutChart";

// Create video element for 180 sound (MP4 requires video element for reliable playback)
const create180Audio = () => {
  const video = document.createElement('video');
  // Use import.meta.env.BASE_URL to handle GitHub Pages subdirectory deployment
  const baseUrl = import.meta.env.BASE_URL || '/';
  video.src = `${baseUrl}sounds/180.mp4`;
  video.currentTime = 1; // Start from second 1
  video.volume = 1.0;
  return video;
};
interface MatchScoringProps {
  match: Match;
  players: Player[];
  tournamentId: string;
  stage: "group" | "knockout";
  showCheckoutSuggestions: boolean;
  checkoutType: string;
  setsToWin: number;
  onComplete: (winnerId: string, loserId: string, player1Sets: number, player2Sets: number, player1TotalScore: number, player1Darts: number, player2TotalScore: number, player2Darts: number) => void;
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
  player1TotalScore: number;
  player1TotalDarts: number;
  player2TotalScore: number;
  player2TotalDarts: number;
}

// Snapshot of the complete game state before each throw
interface GameStateSnapshot {
  throw: ThrowRecord;
  player: 1 | 2;
  player1Score: number;
  player2Score: number;
  player1Darts: number;
  player2Darts: number;
  player1Sets: number;
  player2Sets: number;
  player1TotalScore: number;
  player2TotalScore: number;
  player1TotalDarts: number;
  player2TotalDarts: number;
  currentThrows: ThrowRecord[];
  roundScore: number;
  setNumber: number;
  lockedCheckoutSuggestion: string[] | null;
  suggestionLockedAtThrow: number;
}

export function MatchScoring({
  match,
  players,
  tournamentId,
  stage,
  showCheckoutSuggestions,
  checkoutType,
  setsToWin,
  onComplete,
}: MatchScoringProps) {
  const startingScore = 301;
  const requireDoubleOut = checkoutType === "double";
  
  const player1 = players.find((p) => p.id === match.player1_id);
  const player2 = players.find((p) => p.id === match.player2_id);

  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [player1Score, setPlayer1Score] = useState(startingScore);
  const [player2Score, setPlayer2Score] = useState(startingScore);
  const [player1Darts, setPlayer1Darts] = useState(0);
  const [player2Darts, setPlayer2Darts] = useState(0);
  const [player1Sets, setPlayer1Sets] = useState(0);
  const [player2Sets, setPlayer2Sets] = useState(0);
  const [player1TotalScore, setPlayer1TotalScore] = useState(0);
  const [player2TotalScore, setPlayer2TotalScore] = useState(0);
  const [player1TotalDarts, setPlayer1TotalDarts] = useState(0);
  const [player2TotalDarts, setPlayer2TotalDarts] = useState(0);
  const [currentThrows, setCurrentThrows] = useState<ThrowRecord[]>([]);
  const [roundScore, setRoundScore] = useState(0);
  const [history, setHistory] = useState<GameStateSnapshot[]>([]);
  const [showBust, setShowBust] = useState(false);
  const [bustMessage, setBustMessage] = useState("BUST!");
  const [showSetWin, setShowSetWin] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [setNumber, setSetNumber] = useState(1);
  const [announceScore, setAnnounceScore] = useState<number | null>(null);
  const [lockedCheckoutSuggestion, setLockedCheckoutSuggestion] = useState<string[] | null>(null);
  const [suggestionLockedAtThrow, setSuggestionLockedAtThrow] = useState<number>(0);

  // Use ref to track if we're in the middle of a player switch
  const switchingPlayerRef = useRef(false);

  const currentPlayerScore = currentPlayer === 1 ? player1Score : player2Score;
  const currentPlayerName = currentPlayer === 1 ? player1?.name : player2?.name;

  // Lock checkout suggestion at start of turn if in checkout range
  useEffect(() => {
    if (currentThrows.length === 0) {
      const suggestion = getCheckoutSuggestion(currentPlayerScore, requireDoubleOut);
      setLockedCheckoutSuggestion(suggestion?.darts || null);
      setSuggestionLockedAtThrow(0);
    }
  }, [currentThrows.length, currentPlayerScore, requireDoubleOut]);

  const handleScore = useCallback((score: number, multiplier: number) => {
    if (currentThrows.length >= 3 || matchResult || switchingPlayerRef.current) return;

    const points = score * multiplier;
    const newScore = currentPlayerScore - points;

    // Save complete state snapshot BEFORE making any changes
    const snapshot: GameStateSnapshot = {
      throw: { score, multiplier },
      player: currentPlayer,
      player1Score,
      player2Score,
      player1Darts,
      player2Darts,
      player1Sets,
      player2Sets,
      player1TotalScore,
      player2TotalScore,
      player1TotalDarts,
      player2TotalDarts,
      currentThrows: [...currentThrows],
      roundScore,
      setNumber,
      lockedCheckoutSuggestion,
      suggestionLockedAtThrow,
    };

    // Calculate the score at start of this player's turn (before any throws this round)
    const startOfTurnScore = currentPlayerScore + roundScore;

    // Check for bust conditions
    // Going below 0, or to exactly 1 (impossible to checkout with double from 1)
    const isBust = newScore < 0 || (requireDoubleOut && newScore === 1);

    // Check for invalid checkout (hitting exactly 0 without double in double-out mode)
    const isInvalidCheckout = newScore === 0 && requireDoubleOut && multiplier !== 2 && score !== 50;

    if (isBust || isInvalidCheckout) {
      // Save to history so undo works
      setHistory([...history, snapshot]);

      // Set appropriate bust message
      if (isInvalidCheckout) {
        setBustMessage("Må checke ut med dobbel!");
      } else {
        setBustMessage("BUST!");
      }
      setShowBust(true);
      setTimeout(() => setShowBust(false), 2500);

      // Register the throw, then bust the whole round
      const newThrow: ThrowRecord = { score, multiplier };
      const newThrows = [...currentThrows, newThrow];
      setCurrentThrows(newThrows);

      // Calculate how many darts were thrown this round (including this one)
      // A bust means the round score is 0, but ALL 3 darts count for AVG
      const dartsThisRound = newThrows.length;
      const remainingDartsInRound = 3 - dartsThisRound;

      // Update darts count - count ALL darts thrown AND fill up to 3 darts for the round
      // Score for this round is 0 (bust annuls all points)
      if (currentPlayer === 1) {
        setPlayer1Darts(player1Darts + 1);
        // Add total darts: the dart just thrown + remaining darts to complete the round
        // Score stays 0 for bust (we don't add roundScore to total)
        setPlayer1TotalDarts(player1TotalDarts + 1 + remainingDartsInRound);
        // Reset score to start of turn (annulerer hele runden)
        setPlayer1Score(startOfTurnScore);
      } else {
        setPlayer2Darts(player2Darts + 1);
        // Add total darts: the dart just thrown + remaining darts to complete the round
        // Score stays 0 for bust (we don't add roundScore to total)
        setPlayer2TotalDarts(player2TotalDarts + 1 + remainingDartsInRound);
        // Reset score to start of turn (annulerer hele runden)
        setPlayer2Score(startOfTurnScore);
      }

      // Switch to next player after a short delay
      switchingPlayerRef.current = true;
      setTimeout(() => {
        switchPlayer();
        switchingPlayerRef.current = false;
      }, 500);
      return;
    }

    // Valid throw - save to history and apply
    setHistory([...history, snapshot]);

    const newThrow: ThrowRecord = { score, multiplier };
    const newThrows = [...currentThrows, newThrow];
    setCurrentThrows(newThrows);
    setRoundScore(roundScore + points);

    // Check if throw matches the locked checkout suggestion
    // If not, unlock the suggestion so it recalculates for new score
    const throwIndexInSuggestion = currentThrows.length - suggestionLockedAtThrow;
    if (lockedCheckoutSuggestion && lockedCheckoutSuggestion.length > throwIndexInSuggestion) {
      const expectedDart = lockedCheckoutSuggestion[throwIndexInSuggestion];
      if (!doesThrowMatchSuggestion(score, multiplier, expectedDart)) {
        // Player missed the suggested dart - unlock and get new suggestion for remaining score
        const newSuggestion = getCheckoutSuggestion(newScore, requireDoubleOut);
        setLockedCheckoutSuggestion(newSuggestion?.darts || null);
        setSuggestionLockedAtThrow(currentThrows.length + 1); // Lock at next throw position
      }
    }

    // Update score, darts, and total tracking
    if (currentPlayer === 1) {
      setPlayer1Score(newScore);
      setPlayer1Darts(player1Darts + 1);
      setPlayer1TotalScore(player1TotalScore + points);
      setPlayer1TotalDarts(player1TotalDarts + 1);
    } else {
      setPlayer2Score(newScore);
      setPlayer2Darts(player2Darts + 1);
      setPlayer2TotalScore(player2TotalScore + points);
      setPlayer2TotalDarts(player2TotalDarts + 1);
    }

    // Check for set win (valid checkout)
    if (newScore === 0) {
      handleSetWin();
      return;
    }

    // Check for 180 (3 triple 20s = 180 points after 3 throws)
    const newRoundScore = roundScore + points;
    const is180 = newThrows.length === 3 && newRoundScore === 180;

    // Auto-switch after 3 darts - show score announcement first
    if (newThrows.length >= 3) {
      switchingPlayerRef.current = true;
      
      // Show the score announcement for the referee
      setAnnounceScore(newRoundScore);
      
      if (is180) {
        // Play 180 sound and wait for it to finish before switching
        const audio = create180Audio();
        audio.onended = () => {
          setAnnounceScore(null);
          switchPlayer();
          switchingPlayerRef.current = false;
        };
        audio.play().catch(err => {
          console.log('Could not play 180 sound:', err);
          // Fallback: switch after delay if audio fails
          setTimeout(() => {
            setAnnounceScore(null);
            switchPlayer();
            switchingPlayerRef.current = false;
          }, 2000);
        });
      } else {
        // Show score for 2 seconds then switch
        setTimeout(() => {
          setAnnounceScore(null);
          switchPlayer();
          switchingPlayerRef.current = false;
        }, 2000);
      }
    }
  }, [currentThrows, currentPlayerScore, currentPlayer, roundScore, player1Darts, player2Darts, player1Score, player2Score, player1Sets, player2Sets, setNumber, requireDoubleOut, matchResult, history]);

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
          player1TotalScore,
          player1TotalDarts,
          player2TotalScore,
          player2TotalDarts,
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
          player1TotalScore,
          player1TotalDarts,
          player2TotalScore,
          player2TotalDarts,
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
    onComplete(
      matchResult.winnerId, 
      matchResult.loserId, 
      matchResult.player1Sets, 
      matchResult.player2Sets,
      matchResult.player1TotalScore,
      matchResult.player1TotalDarts,
      matchResult.player2TotalScore,
      matchResult.player2TotalDarts
    );
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
    if (history.length === 0) return;

    // If match was won, clear the result to allow undo
    if (matchResult) {
      setMatchResult(null);
    }

    // Get the last snapshot - this contains the state BEFORE that throw
    const lastSnapshot = history[history.length - 1];

    // Remove from history
    setHistory(history.slice(0, -1));

    // Restore complete game state from snapshot
    setPlayer1Score(lastSnapshot.player1Score);
    setPlayer2Score(lastSnapshot.player2Score);
    setPlayer1Darts(lastSnapshot.player1Darts);
    setPlayer2Darts(lastSnapshot.player2Darts);
    setPlayer1TotalScore(lastSnapshot.player1TotalScore);
    setPlayer2TotalScore(lastSnapshot.player2TotalScore);
    setPlayer1TotalDarts(lastSnapshot.player1TotalDarts);
    setPlayer2TotalDarts(lastSnapshot.player2TotalDarts);
    setPlayer2Darts(lastSnapshot.player2Darts);
    setPlayer1Sets(lastSnapshot.player1Sets);
    setPlayer2Sets(lastSnapshot.player2Sets);
    setSetNumber(lastSnapshot.setNumber);
    setCurrentPlayer(lastSnapshot.player);
    setCurrentThrows(lastSnapshot.currentThrows);
    setRoundScore(lastSnapshot.roundScore);
    setLockedCheckoutSuggestion(lastSnapshot.lockedCheckoutSuggestion);
    setSuggestionLockedAtThrow(lastSnapshot.suggestionLockedAtThrow);
  };

  const formatThrow = (t: ThrowRecord) => {
    if (t.score === 0) return { text: "Bom", isMiss: true };
    if (t.multiplier === 2) return { text: `D${t.score}`, isMiss: false };
    if (t.multiplier === 3) return { text: `T${t.score}`, isMiss: false };
    return { text: `${t.score}`, isMiss: false };
  };

  return (
    <div className="relative h-full min-h-screen flex flex-col">
      {/* BUST Overlay */}
      {showBust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-in fade-in duration-200">
          <div className="text-6xl md:text-[10rem] font-display font-bold text-destructive animate-in zoom-in-50 duration-300 tracking-wider text-center px-4">
            {bustMessage}
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

      {/* Score Announcement Overlay for Referee */}
      {announceScore !== null && !showBust && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
          <div className="text-center">
            <div className="text-2xl md:text-3xl text-muted-foreground mb-4 animate-in fade-in duration-300">
              {currentPlayerName}
            </div>
            <div className={cn(
              "text-[8rem] md:text-[12rem] font-display font-bold animate-in zoom-in-50 duration-300 tracking-tight",
              announceScore === 180 ? "text-primary" : "text-accent"
            )}>
              {announceScore}
            </div>
            {announceScore === 180 && (
              <div className="text-4xl md:text-6xl mt-4 animate-in slide-in-from-bottom duration-500">
                🎯🔥🎯
              </div>
            )}
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

      {/* Header with match info and player names */}
      <div className="text-center pt-1 pb-2 border-b border-border mb-2">
        <h1 className="font-display text-3xl md:text-4xl font-bold">
          {player1?.name} vs {player2?.name}
        </h1>
        <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground inline-block mt-1">
          {stage === "knockout" ? "Sluttspill" : (match.stage === "league" ? "Ligakamper" : "Gruppespill")} • 301 • 
          {requireDoubleOut ? " Dobbel checkout" : " Single checkout"} • 
          Først til {setsToWin} • Set {setNumber}
        </span>
      </div>

      {/* Main content - fills remaining space */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Left side: Stats and controls */}
        <div className="lg:w-[400px] xl:w-[450px] flex flex-col gap-4 lg:gap-6">
          {/* Scoreboard - stacked vertically */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <PlayerScoreCard
                name={player1?.name || "Spiller 1"}
                score={player1Score}
                sets={player1Sets}
                isActive={currentPlayer === 1}
                setsToWin={setsToWin}
              />
              {showCheckoutSuggestions && currentPlayer === 1 && (
                <CheckoutSuggestionDisplay
                  score={currentPlayerScore}
                  requireDoubleOut={requireDoubleOut}
                  dartsThrown={currentThrows.length}
                  lockedSuggestion={lockedCheckoutSuggestion}
                  suggestionLockedAtThrow={suggestionLockedAtThrow}
                />
              )}
            </div>
            <div className="space-y-2">
              <PlayerScoreCard
                name={player2?.name || "Spiller 2"}
                score={player2Score}
                sets={player2Sets}
                isActive={currentPlayer === 2}
                setsToWin={setsToWin}
              />
              {showCheckoutSuggestions && currentPlayer === 2 && (
                <CheckoutSuggestionDisplay
                  score={currentPlayerScore}
                  requireDoubleOut={requireDoubleOut}
                  dartsThrown={currentThrows.length}
                  lockedSuggestion={lockedCheckoutSuggestion}
                  suggestionLockedAtThrow={suggestionLockedAtThrow}
                />
              )}
            </div>
          </div>

          {/* Current round */}
          <div className="bg-muted rounded-xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm lg:text-base text-muted-foreground">
                {currentPlayerName}'s tur
              </span>
              <span className="font-bold text-2xl lg:text-3xl text-accent">+{roundScore}</span>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-3 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-16 lg:h-20 rounded-lg flex items-center justify-center font-bold text-xl lg:text-2xl",
                    currentThrows[i]
                      ? currentThrows[i].score === 0 
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                      : "bg-background border-2 border-border"
                  )}
                >
                  {currentThrows[i] ? formatThrow(currentThrows[i]).text : "-"}
                </div>
              ))}
            </div>

            <div className="flex gap-2 lg:gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={undoLastThrow}
                disabled={history.length === 0}
                className="text-sm lg:text-base"
              >
                <Undo2 className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Angre
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={switchPlayer}
                className="ml-auto text-sm lg:text-base"
              >
                Neste spiller
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right side: Dartboard - takes remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-[400px] lg:min-h-0">
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
  isActive,
  setsToWin,
}: {
  name: string;
  score: number;
  sets: number;
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
      <div className="flex items-center mt-4 text-base">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <span className="text-lg font-semibold">{sets}/{setsToWin}</span>
        </div>
      </div>
    </div>
  );
}
