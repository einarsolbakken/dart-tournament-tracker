import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { Header } from "@/components/Header";
import { Plus, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import { useState } from "react";

const Index = () => {
  const { data: tournaments } = useTournaments();
  const [activeCard, setActiveCard] = useState(1); // Start with "Ny Turnering" in center

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const cards = [
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte`,
      icon: History,
      to: "/history",
      gradient: "from-slate-600/80 to-slate-900/90",
    },
    {
      title: "Ny Turnering",
      description: "Opprett en ny dartturnering",
      icon: Plus,
      to: "/create",
      gradient: "from-emerald-600/80 to-emerald-900/90",
    },
    {
      title: "Aktive",
      description: `${activeTournaments.length} pågående`,
      icon: Target,
      to: "/active",
      gradient: "from-amber-600/80 to-amber-900/90",
    },
  ];


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero with Logo - centered above cards */}
      <div className="flex justify-center pt-8 px-4">
        <img src={dartArenaLogo} alt="DartArena" className="h-48 md:h-64 w-auto" />
      </div>

      {/* Centered Card Carousel */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl mx-auto px-4">
          {/* Cards Container */}
          <div className="flex justify-center items-center min-h-[450px]">
            {cards.map((card, index) => (
              <Link
                key={index}
                to={card.to}
                onClick={() => setActiveCard(index)}
                className={`
                  absolute transition-all duration-500 ease-out cursor-pointer
                  ${activeCard === index 
                    ? "z-30 scale-100 opacity-100" 
                    : activeCard === index - 1
                      ? "z-20 scale-90 opacity-60 translate-x-[60%]"
                      : activeCard === index + 1
                        ? "z-20 scale-90 opacity-60 -translate-x-[60%]"
                        : index < activeCard
                          ? "z-10 scale-75 opacity-30 -translate-x-[120%]"
                          : "z-10 scale-75 opacity-30 translate-x-[120%]"
                  }
                `}
              >
                <div
                  className={`
                    w-[320px] h-[420px]
                    rounded-3xl overflow-hidden
                    bg-gradient-to-br ${card.gradient}
                    border border-white/10
                    shadow-2xl
                    transition-shadow duration-300
                    ${activeCard === index ? "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]" : ""}
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
                        {card.to === "/create" ? "Start" : "Se alle"}
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
            ))}
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
          <p className="text-center text-muted-foreground/50 text-sm">
            Trykk på prikkene eller kortene for å navigere
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
