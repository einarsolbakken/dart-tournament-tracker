import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { Header } from "@/components/Header";
import { Plus, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";

const Index = () => {
  const { data: tournaments } = useTournaments();

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const cards = [
    {
      title: "Ny Turnering",
      description: "Opprett en ny dartturnering",
      icon: Plus,
      to: "/create",
      bgClass: "from-primary/40 via-primary/20 to-background",
      iconBg: "bg-primary/30",
      iconColor: "text-primary",
    },
    {
      title: "Aktive",
      description: `${activeTournaments.length} pågående`,
      icon: Target,
      to: "/active",
      bgClass: "from-accent/40 via-accent/20 to-background",
      iconBg: "bg-accent/30",
      iconColor: "text-accent",
    },
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte`,
      icon: History,
      to: "/history",
      bgClass: "from-muted via-muted/60 to-background",
      iconBg: "bg-foreground/10",
      iconColor: "text-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero with Logo */}
      <div className="flex justify-center pt-6 pb-2 px-4">
        <img src={dartArenaLogo} alt="DartArena" className="h-24 md:h-32 w-auto" />
      </div>

      <p className="text-muted-foreground text-center text-sm px-4 mb-4">
        Turneringer og resultater i sanntid
      </p>

      {/* Stacked Cards */}
      <div className="flex-1 relative px-6 pb-8">
        <div className="relative h-[55vh] max-h-[450px]">
          {cards.map((card, index) => (
            <Link
              key={index}
              to={card.to}
              className="absolute inset-x-0 block transition-all duration-500 ease-out hover:translate-y-[-8px]"
              style={{
                top: `${index * 28}px`,
                zIndex: cards.length - index,
                transform: `scale(${1 - index * 0.03})`,
              }}
            >
              <div
                className={`
                  h-[280px] md:h-[320px] rounded-2xl overflow-hidden
                  bg-gradient-to-br ${card.bgClass}
                  border border-border/60
                  shadow-2xl
                  transition-all duration-300
                  hover:shadow-primary/20 hover:border-primary/40
                `}
              >
                {/* Card Content */}
                <div className="h-full p-6 flex flex-col justify-between">
                  {/* Top Section */}
                  <div>
                    <div className={`w-14 h-14 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 backdrop-blur-sm`}>
                      <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl mb-2">{card.title}</h2>
                    <p className="text-muted-foreground">{card.description}</p>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {card.to === "/create" ? "Start" : "Se alle"}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              </div>
            </Link>
          ))}
        </div>

        {/* Hint text */}
        <p className="text-center text-muted-foreground/60 text-xs mt-4">
          Trykk på et kort for å fortsette
        </p>
      </div>
    </div>
  );
};

export default Index;
