import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Target, History, ChevronRight, Circle } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo-new.svg";
import { useState } from "react";

const Index = () => {
  const { data: tournaments } = useTournaments();
  const [activeCard, setActiveCard] = useState(2); // Start with "Ny Turnering" in center

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const cards = [
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte`,
      icon: History,
      to: "/history",
      gradient: "from-slate-600/80 to-slate-900/90",
      cta: "Se alle",
    },
    {
      title: "Bull Off",
      description: "1v1 bull-duell",
      icon: Circle,
      to: "/bull-off",
      gradient: "from-red-600/80 to-red-900/90",
      cta: "Spill",
    },
    {
      title: "Ny Turnering",
      description: "Opprett en ny dartturnering",
      icon: Plus,
      to: "/create",
      gradient: "from-emerald-600/80 to-emerald-900/90",
      cta: "Start",
    },
    {
      title: "Aktive",
      description: `${activeTournaments.length} pågående`,
      icon: Target,
      to: "/active",
      gradient: "from-amber-600/80 to-amber-900/90",
      cta: "Se alle",
    },
  ];


  return (
    <AppLayout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main content - logo and cards in same centered container */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Logo - centered */}
          <img src={dartArenaLogo} alt="DartArena" className="h-48 md:h-64 w-auto mb-4" />

          {/* Cards Container */}
          <div className="relative min-h-[450px] w-full overflow-hidden">
            {cards.map((card, index) => {
              // Calculate circular offset
              const totalCards = cards.length;
              let offset = index - activeCard;
              
              // Wrap around for circular navigation
              if (offset > totalCards / 2) offset -= totalCards;
              if (offset < -totalCards / 2) offset += totalCards;
              
              // Only show 3 cards: current (-1, 0, +1)
              const isVisible = Math.abs(offset) <= 1;
              
              if (!isVisible) return null;
              
              return (
                <Link
                  key={index}
                  to={card.to}
                  onClick={(e) => {
                    if (index !== activeCard) {
                      e.preventDefault();
                      setActiveCard(index);
                    }
                  }}
                  className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out cursor-pointer"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${offset * 280}px) scale(${offset === 0 ? 1 : 0.85})`,
                    zIndex: offset === 0 ? 30 : 20,
                    opacity: offset === 0 ? 1 : 0.5,
                  }}
                >
                  <div
                    className={`
                      w-[320px] h-[420px]
                      rounded-3xl overflow-hidden
                      bg-gradient-to-br ${card.gradient}
                      border border-white/10
                      shadow-2xl
                      transition-shadow duration-300
                      ${offset === 0 ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]" : ""}
                      hover:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.6)]
                    `}
                  >
                    <div className="h-full p-8 flex flex-col justify-between relative">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <card.icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div>
                        <h2 className="font-display text-4xl text-white mb-3">{card.title}</h2>
                        <p className="text-white/70 text-lg mb-6">{card.description}</p>
                        
                        <span className="inline-flex items-center gap-2 text-white font-medium text-lg">
                          {card.cta}
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </div>

                      {/* Card number watermark */}
                      <div className="absolute bottom-6 right-6 text-white/10 font-display text-8xl">
                        0{index + 1}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Dot indicators - clickable */}
          <div className="flex justify-center gap-3 py-6">
            {cards.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveCard(index)}
                className={`
                  h-3 rounded-full transition-all duration-300 cursor-pointer
                  ${activeCard === index 
                    ? "w-10 bg-primary" 
                    : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }
                `}
                aria-label={`Gå til kort ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipe hint */}
          <p className="text-center text-muted-foreground/50 text-sm pb-4">
            Trykk på prikkene eller kortene for å navigere
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
