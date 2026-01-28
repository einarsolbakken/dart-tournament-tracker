import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full py-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <motion.button
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
              initial={false}
              animate={{
                scale: step.number === currentStep ? 1.1 : 1,
              }}
              whileHover={step.number <= currentStep ? { scale: step.number === currentStep ? 1.15 : 1.08 } : {}}
              whileTap={step.number < currentStep ? { scale: 0.95 } : {}}
            >
              {step.number < currentStep ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              ) : (
                <span>{step.number}</span>
              )}
              
              {/* Pulse animation for current step */}
              {step.number === currentStep && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
            
            {/* Label */}
            <motion.span
              className={cn(
                "mt-2 text-xs sm:text-sm font-medium text-center max-w-[70px] sm:max-w-[80px] leading-tight",
                step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
              initial={false}
              animate={{
                opacity: step.number <= currentStep ? 1 : 0.6,
              }}
            >
              {step.label}
            </motion.span>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="relative w-12 sm:w-20 md:w-28 h-0.5 mx-1 sm:mx-2 -mt-6">
              <div className="absolute inset-0 bg-border/50 rounded-full" />
              <motion.div
                className="absolute inset-0 bg-primary rounded-full origin-left"
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: step.number < currentStep ? 1 : 0 
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
