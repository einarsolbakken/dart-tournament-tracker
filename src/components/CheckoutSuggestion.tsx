import { getCheckoutSuggestion, formatDartDisplay } from "@/lib/checkoutChart";

interface CheckoutSuggestionProps {
  score: number;
  requireDoubleOut: boolean;
  dartsThrown: number;
  lockedSuggestion: string[] | null;
}

export function CheckoutSuggestionDisplay({
  score,
  requireDoubleOut,
  dartsThrown,
  lockedSuggestion,
}: CheckoutSuggestionProps) {
  // If we have a locked suggestion, show remaining darts from that
  if (lockedSuggestion && lockedSuggestion.length > 0) {
    const remainingDarts = lockedSuggestion.slice(dartsThrown);
    
    if (remainingDarts.length === 0) {
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

  if (!suggestion || dartsThrown >= 3) {
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
