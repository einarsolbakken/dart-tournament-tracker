import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DartBoardProps {
  onScore: (score: number, multiplier: number) => void;
  disabled?: boolean;
}

const SEGMENT_NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export function DartBoard({ onScore, disabled }: DartBoardProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const segments = useMemo(() => {
    const segs: React.ReactNode[] = [];
    const cx = 200;
    const cy = 200;
    const segmentAngle = 360 / 20;

    SEGMENT_NUMBERS.forEach((num, index) => {
      const startAngle = (index * segmentAngle - 99) * (Math.PI / 180);
      const endAngle = ((index + 1) * segmentAngle - 99) * (Math.PI / 180);
      const isEven = index % 2 === 0;

      // Radii for different rings
      const rings = [
        { inner: 160, outer: 180, multiplier: 2, name: "double" }, // Double ring
        { inner: 100, outer: 160, multiplier: 1, name: "single-outer" }, // Outer single
        { inner: 90, outer: 100, multiplier: 3, name: "triple" }, // Triple ring
        { inner: 20, outer: 90, multiplier: 1, name: "single-inner" }, // Inner single
      ];

      rings.forEach(({ inner, outer, multiplier, name }) => {
        const x1 = cx + inner * Math.cos(startAngle);
        const y1 = cy + inner * Math.sin(startAngle);
        const x2 = cx + outer * Math.cos(startAngle);
        const y2 = cy + outer * Math.sin(startAngle);
        const x3 = cx + outer * Math.cos(endAngle);
        const y3 = cy + outer * Math.sin(endAngle);
        const x4 = cx + inner * Math.cos(endAngle);
        const y4 = cy + inner * Math.sin(endAngle);

        const pathD = `
          M ${x1} ${y1}
          L ${x2} ${y2}
          A ${outer} ${outer} 0 0 1 ${x3} ${y3}
          L ${x4} ${y4}
          A ${inner} ${inner} 0 0 0 ${x1} ${y1}
          Z
        `;

        const segmentId = `${name}-${num}`;
        const isHovered = hoveredSegment === segmentId;
        
        let fillColor = "";
        if (name === "double" || name === "triple") {
          fillColor = isEven ? "hsl(var(--dart-red))" : "hsl(var(--dart-green))";
        } else {
          fillColor = isEven ? "hsl(45 20% 10%)" : "hsl(45 30% 85%)";
        }

        segs.push(
          <path
            key={segmentId}
            d={pathD}
            fill={fillColor}
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            className={cn(
              "transition-all cursor-pointer",
              isHovered && "brightness-125 drop-shadow-lg",
              disabled && "cursor-not-allowed opacity-60"
            )}
            onMouseEnter={() => !disabled && setHoveredSegment(segmentId)}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => !disabled && onScore(num, multiplier)}
          />
        );
      });

      // Add number labels
      const labelRadius = 190;
      const midAngle = ((index + 0.5) * segmentAngle - 99) * (Math.PI / 180);
      const labelX = cx + labelRadius * Math.cos(midAngle);
      const labelY = cy + labelRadius * Math.sin(midAngle);

      segs.push(
        <text
          key={`label-${num}`}
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-xs font-bold pointer-events-none select-none"
        >
          {num}
        </text>
      );
    });

    return segs;
  }, [hoveredSegment, disabled, onScore]);

  const handleBullClick = (isBullseye: boolean) => {
    if (disabled) return;
    onScore(isBullseye ? 50 : 25, 1);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[700px] xl:max-w-[800px] mx-auto">
        {/* Outer ring background */}
        <circle cx="200" cy="200" r="180" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="1" />
        
        {/* Segments */}
        {segments}
        
        {/* Outer bull (25) */}
        <circle
          cx="200"
          cy="200"
          r="20"
          fill="hsl(var(--dart-green))"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          className={cn(
            "cursor-pointer transition-all",
            hoveredSegment === "outer-bull" && "brightness-125",
            disabled && "cursor-not-allowed opacity-60"
          )}
          onMouseEnter={() => !disabled && setHoveredSegment("outer-bull")}
          onMouseLeave={() => setHoveredSegment(null)}
          onClick={() => handleBullClick(false)}
        />
        
        {/* Bullseye (50) */}
        <circle
          cx="200"
          cy="200"
          r="8"
          fill="hsl(var(--dart-red))"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          className={cn(
            "cursor-pointer transition-all",
            hoveredSegment === "bullseye" && "brightness-125",
            disabled && "cursor-not-allowed opacity-60"
          )}
          onMouseEnter={() => !disabled && setHoveredSegment("bullseye")}
          onMouseLeave={() => setHoveredSegment(null)}
          onClick={() => handleBullClick(true)}
        />
      </svg>

      {/* Quick score buttons - under dartboard */}
      <div className="flex justify-center gap-4 mt-6">
        <QuickButton onClick={() => onScore(0, 1)} disabled={disabled}>
          Miss
        </QuickButton>
        <QuickButton onClick={() => onScore(25, 1)} disabled={disabled}>
          25
        </QuickButton>
        <QuickButton onClick={() => onScore(50, 1)} disabled={disabled}>
          Bull
        </QuickButton>
      </div>
    </div>
  );
}

function QuickButton({ 
  children, 
  onClick, 
  disabled 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-3 rounded-lg text-base font-semibold transition-colors",
        "bg-muted hover:bg-muted/80 text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
