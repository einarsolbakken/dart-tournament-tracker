import { getCheckoutSuggestion, getDartColorClass, formatDartDisplay } from "@/lib/checkoutChart";
import { cn } from "@/lib/utils";

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
      <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="text-sm text-muted-foreground mb-2 text-center">
          Forslag til checkout
        </div>
        <div className="flex items-center justify-center gap-2">
          {remainingDarts.map((dart, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-lg shadow-sm",
                  getDartColorClass(dart)
                )}
              >
                {formatDartDisplay(dart)}
              </div>
              {index < remainingDarts.length - 1 && (
                <span className="text-muted-foreground text-lg">→</span>
              )}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {requireDoubleOut ? "Dobbel checkout påkrevd" : "Single checkout"}
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
    <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="text-sm text-muted-foreground mb-2 text-center">
        Forslag til checkout
      </div>
      <div className="flex items-center justify-center gap-2">
        {suggestion.darts.map((dart, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-lg shadow-sm",
                getDartColorClass(dart)
              )}
            >
              {formatDartDisplay(dart)}
            </div>
            {index < suggestion.darts.length - 1 && (
              <span className="text-muted-foreground text-lg">→</span>
            )}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        {requireDoubleOut ? "Dobbel checkout påkrevd" : "Single checkout"}
      </div>
    </div>
  );
}
