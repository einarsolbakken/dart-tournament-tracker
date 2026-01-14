import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { Header } from "@/components/Header";
import { Plus, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import { useRef, useState } from "react";

const Index = () => {
  const { data: tournaments } = useTournaments();
  const [activeCard, setActiveCard] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const cards = [
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
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte`,
      icon: History,
      to: "/history",
      gradient: "from-slate-600/80 to-slate-900/90",
    },
  ];

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const cardWidth = 280;
    const newActive = Math.round(scrollLeft / cardWidth);
    setActiveCard(Math.min(Math.max(newActive, 0), cards.length - 1));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero with Logo */}
      <div className="flex justify-center pt-8 pb-4 px-4">
        <img src={dartArenaLogo} alt="DartArena" className="h-28 md:h-36 w-auto" />
      </div>

      <p className="text-muted-foreground text-center text-sm px-4 mb-8">
        Turneringer og resultater i sanntid
      </p>

      {/* Horizontal Scrolling Cards */}
      <div className="flex-1 flex flex-col">
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-0 pb-4 px-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {cards.map((card, index) => (
            <Link
              key={index}
              to={card.to}
              className="snap-center flex-shrink-0 first:ml-0"
              style={{
                width: "280px",
                marginLeft: index === 0 ? "0" : "-40px",
                zIndex: activeCard === index ? 10 : cards.length - index,
              }}
            >
              <div
                className={`
                  w-full h-[50vh] max-h-[400px] min-h-[300px]
                  rounded-3xl overflow-hidden
                  bg-gradient-to-br ${card.gradient}
                  border border-white/10
                  shadow-2xl
                  transition-all duration-300 ease-out
                  ${activeCard === index 
                    ? "scale-100 shadow-2xl" 
                    : "scale-95 opacity-80"
                  }
                  hover:scale-[1.02]
                `}
              >
                <div className="h-full p-6 flex flex-col justify-between relative">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <card.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <div>
                    <h2 className="font-display text-3xl text-white mb-2">{card.title}</h2>
                    <p className="text-white/70 mb-4">{card.description}</p>
                    
                    <span className="inline-flex items-center gap-1 text-white font-medium">
                      {card.to === "/create" ? "Start" : "Se alle"}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Card number watermark */}
                  <div className="absolute bottom-4 right-4 text-white/10 font-display text-7xl">
                    0{index + 1}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {/* End spacer */}
          <div className="flex-shrink-0 w-8" />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 py-4">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                containerRef.current?.scrollTo({
                  left: index * 240,
                  behavior: "smooth",
                });
              }}
              className={`
                h-2 rounded-full transition-all duration-300
                ${activeCard === index 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }
              `}
            />
          ))}
        </div>

        {/* Swipe hint */}
        <p className="text-center text-muted-foreground/50 text-xs pb-4">
          ← Sveip for å se flere →
        </p>
      </div>
    </div>
  );
};

export default Index;
