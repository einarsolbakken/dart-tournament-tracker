import { getCheckoutSuggestion, formatDartDisplay } from "@/lib/checkoutChart";

interface CheckoutSuggestionProps {
  score: number;
  requireDoubleOut: boolean;
  dartsThrown: number;
  lockedSuggestion: string[] | null;
  suggestionLockedAtThrow: number;
}

export function CheckoutSuggestionDisplay({
  score,
  requireDoubleOut,
  dartsThrown,
  lockedSuggestion,
  suggestionLockedAtThrow,
}: CheckoutSuggestionProps) {
  // Calculate how many darts left in this round
  const dartsRemaining = 3 - dartsThrown;
  
  // Calculate how many darts into the suggestion we are
  const dartsIntoSuggestion = dartsThrown - suggestionLockedAtThrow;

  // If we have a locked suggestion, show remaining darts from that
  if (lockedSuggestion && lockedSuggestion.length > 0) {
    const remainingDarts = lockedSuggestion.slice(dartsIntoSuggestion);
    
    // Don't show if no remaining darts in suggestion, or if we can't complete the checkout this round
    if (remainingDarts.length === 0 || remainingDarts.length > dartsRemaining) {
      return null;
    }

    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-accent/80 rounded overflow-hidden">
          {remainingDarts.map((dart, index) => (
            <div key={index} className="flex items-center">
              <div className="px-3 py-1.5 font-bold text-sm text-accent-foreground tracking-wide">
                {formatDartDisplay(dart)}
              </div>
              {index < remainingDarts.length - 1 && (
                <div className="w-px h-5 bg-accent-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No locked suggestion - check if we can show a new one
  const suggestion = getCheckoutSuggestion(score, requireDoubleOut);

  // Don't show if no suggestion, no darts left, or can't complete checkout this round
  if (!suggestion || dartsRemaining === 0 || suggestion.darts.length > dartsRemaining) {
    return null;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center bg-accent/80 rounded overflow-hidden">
        {suggestion.darts.map((dart, index) => (
          <div key={index} className="flex items-center">
            <div className="px-3 py-1.5 font-bold text-sm text-accent-foreground tracking-wide">
              {formatDartDisplay(dart)}
            </div>
            {index < suggestion.darts.length - 1 && (
              <div className="w-px h-5 bg-accent-foreground/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
