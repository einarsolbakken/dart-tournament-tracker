import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message = "Setter opp turneringen...", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className="w-24 h-24 border-4 border-primary/20 rounded-full" />
        
        {/* Spinning ring */}
        <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        
        {/* Center dartboard icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Target className="w-10 h-10 text-primary animate-pulse" />
        </div>
      </div>
      
      <p className="mt-6 text-lg font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
      
      <div className="mt-4 flex gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
