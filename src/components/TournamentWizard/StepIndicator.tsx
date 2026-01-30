import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const StepIndicator = forwardRef<HTMLDivElement, StepIndicatorProps>(
  function StepIndicator({ steps, currentStep, onStepClick }, ref) {
    return (
      <div ref={ref} className="flex items-center justify-center w-full py-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.number)}
                disabled={step.number > currentStep}
                className={cn(
                  "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300",
                  "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50",
                  step.number < currentStep && [
                    "bg-primary border-primary text-primary-foreground cursor-pointer",
                    "hover:bg-primary/90 hover:scale-105"
                  ],
                  step.number === currentStep && [
                    "bg-primary border-primary text-primary-foreground",
                    "ring-4 ring-primary/30 scale-110"
                  ],
                  step.number > currentStep && [
                    "bg-muted/30 border-border/50 text-muted-foreground cursor-not-allowed"
                  ]
                )}
              >
                {step.number < currentStep ? (
                  <div className="animate-scale-in">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                ) : (
                  <span>{step.number}</span>
                )}
                
                {/* Pulse animation for current step */}
                {step.number === currentStep && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
                )}
              </button>
              
              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs sm:text-sm font-medium text-center max-w-[70px] sm:max-w-[80px] leading-tight transition-opacity duration-300",
                  step.number <= currentStep ? "text-foreground opacity-100" : "text-muted-foreground opacity-60"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="relative w-12 sm:w-20 md:w-28 h-0.5 mx-1 sm:mx-2 -mt-6">
                <div className="absolute inset-0 bg-border/50 rounded-full" />
                <div
                  className={cn(
                    "absolute inset-0 bg-primary rounded-full origin-left transition-transform duration-500 ease-out",
                    step.number < currentStep ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
);
