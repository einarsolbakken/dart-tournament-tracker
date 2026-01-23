import { getCheckoutSuggestion, getDartColorClass, formatDartDisplay } from "@/lib/checkoutChart";
import { cn } from "@/lib/utils";

interface CheckoutSuggestionProps {
  score: number;
  requireDoubleOut: boolean;
  dartsRemaining: number;
}

export function CheckoutSuggestionDisplay({
  score,
  requireDoubleOut,
  dartsRemaining,
}: CheckoutSuggestionProps) {
  const suggestion = getCheckoutSuggestion(score, requireDoubleOut);

  if (!suggestion || dartsRemaining === 0) {
    return null;
  }

  // Only show the darts that are relevant for remaining darts
  // If 3 darts remaining, show all. If 2 remaining, we still show full suggestion
  // since player might need to know the full route
  const dartsToShow = suggestion.darts;

  return (
    <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="text-sm text-muted-foreground mb-2 text-center">
        Forslag til checkout
      </div>
      <div className="flex items-center justify-center gap-2">
        {dartsToShow.map((dart, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-lg shadow-sm",
                getDartColorClass(dart)
              )}
            >
              {formatDartDisplay(dart)}
            </div>
            {index < dartsToShow.length - 1 && (
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
