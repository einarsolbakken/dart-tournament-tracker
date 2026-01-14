import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { Header } from "@/components/Header";
import { Plus, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import { useRef, useState, useEffect } from "react";

const Index = () => {
  const { data: tournaments } = useTournaments();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
      description: `${activeTournaments.length} pågående turneringer`,
      icon: Target,
      to: "/active",
      bgClass: "bg-gradient-to-br from-accent/30 via-accent/10 to-background",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
    },
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte turneringer`,
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
      const cardWidth = container.offsetWidth * 0.85;
      const newIndex = Math.round(scrollLeft / (cardWidth - 40));
      setActiveIndex(Math.min(newIndex, cards.length - 1));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [cards.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero with Logo */}
      <div className="flex justify-center pt-8 pb-4 px-4">
        <img src={dartArenaLogo} alt="DartArena" className="h-32 md:h-40 w-auto" />
      </div>

      {/* Full-screen Cards Carousel */}
      <div className="flex-1 relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full pb-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {cards.map((card, index) => (
            <Link
              key={index}
              to={card.to}
              className="snap-center flex-shrink-0 first:pl-4 last:pr-4"
              style={{
                width: "85vw",
                marginRight: index < cards.length - 1 ? "-40px" : "0",
              }}
            >
              <div
                className={`
                  relative h-[60vh] md:h-[50vh] rounded-3xl overflow-hidden
                  ${card.bgClass}
                  border border-border/50
                  shadow-2xl
                  transition-all duration-500
                  hover:scale-[1.02] hover:shadow-primary/20
                  ${activeIndex === index ? "scale-100 opacity-100" : "scale-95 opacity-70"}
                `}
                style={{
                  transform: `translateX(${index * 10}px)`,
                  zIndex: cards.length - index,
                }}
              >
                {/* Card Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  {/* Top Section */}
                  <div>
                    <div className={`w-16 h-16 rounded-2xl ${card.iconBg} flex items-center justify-center mb-6`}>
                      <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl mb-3">{card.title}</h2>
                    <p className="text-muted-foreground text-lg">{card.description}</p>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-medium flex items-center gap-2 text-lg">
                      {card.to === "/create" ? "Kom i gang" : "Se alle"}
                      <ChevronRight className="w-5 h-5" />
                    </span>
                    
                    {/* Card number indicator */}
                    <span className="text-muted-foreground/50 font-display text-6xl md:text-8xl">
                      0{index + 1}
                    </span>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </div>
            </Link>
          ))}
        </div>

        {/* Scroll Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-300
                ${activeIndex === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
