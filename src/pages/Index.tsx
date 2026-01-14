import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { Header } from "@/components/Header";
import { Plus, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import { useRef, useState, useEffect } from "react";

const Index = () => {
  const { data: tournaments } = useTournaments();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const cards = [
    {
      title: "Ny Turnering",
      description: "Opprett en ny dartturnering og inviter spillere",
      icon: Plus,
      to: "/create",
      bgClass: "bg-gradient-to-br from-primary/30 via-primary/10 to-background",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
    },
    {
      title: "Aktive Turneringer",
      description: `${activeTournaments.length} pågående`,
      icon: Target,
      to: "/active",
      bgClass: "bg-gradient-to-br from-accent/30 via-accent/10 to-background",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
    },
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte`,
      icon: History,
      to: "/history",
      bgClass: "bg-gradient-to-br from-muted via-muted/50 to-background",
      iconBg: "bg-muted",
      iconColor: "text-foreground",
    },
  ];

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const getCardTransform = (index: number) => {
    const cardProgress = scrollProgress * (cards.length - 1);
    const diff = index - cardProgress;
    
    // Parallax: cards behind move slower
    const translateX = diff * 20;
    const scale = 1 - Math.abs(diff) * 0.08;
    const opacity = 1 - Math.abs(diff) * 0.3;
    const rotateY = diff * -5;
    
    return {
      transform: `translateX(${translateX}px) scale(${Math.max(scale, 0.85)}) perspective(1000px) rotateY(${rotateY}deg)`,
      opacity: Math.max(opacity, 0.4),
      zIndex: cards.length - Math.abs(Math.round(diff)),
    };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      
      {/* Hero with Logo */}
      <div className="flex justify-center pt-6 pb-4 px-4">
        <img src={dartArenaLogo} alt="DartArena" className="h-28 md:h-36 w-auto" />
      </div>

      <p className="text-muted-foreground text-center px-4 mb-6">
        Opprett turneringer og følg resultater i sanntid
      </p>

      {/* Cards Carousel */}
      <div className="flex-1 relative px-4">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Spacer for centering first card */}
          <div className="flex-shrink-0 w-[8vw]" />
          
          {cards.map((card, index) => {
            const transforms = getCardTransform(index);
            
            return (
              <Link
                key={index}
                to={card.to}
                className="snap-center flex-shrink-0 transition-all duration-500 ease-out"
                style={{
                  width: "75vw",
                  maxWidth: "320px",
                  ...transforms,
                }}
              >
                <div
                  className={`
                    relative h-[45vh] max-h-[380px] rounded-2xl overflow-hidden
                    ${card.bgClass}
                    border border-border/50
                    shadow-xl hover:shadow-2xl
                    transition-shadow duration-300
                  `}
                >
                  {/* Card Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    {/* Top Section */}
                    <div>
                      <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4`}>
                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl mb-2">{card.title}</h2>
                      <p className="text-muted-foreground">{card.description}</p>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-medium flex items-center gap-1">
                        {card.to === "/create" ? "Start" : "Se alle"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                      
                      {/* Card number */}
                      <span className="text-muted-foreground/30 font-display text-5xl">
                        0{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Decorative blur */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                </div>
              </Link>
            );
          })}
          
          {/* Spacer for centering last card */}
          <div className="flex-shrink-0 w-[8vw]" />
        </div>

        {/* Scroll Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {cards.map((_, index) => {
            const cardProgress = scrollProgress * (cards.length - 1);
            const isActive = Math.abs(index - cardProgress) < 0.5;
            
            return (
              <div
                key={index}
                className={`
                  h-1.5 rounded-full transition-all duration-300
                  ${isActive ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
