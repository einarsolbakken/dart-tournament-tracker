import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { Header } from "@/components/Header";
import { Plus, Trophy, Target, History, ChevronRight } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const { data: tournaments, isLoading } = useTournaments();

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  const quickActions = [
    {
      title: "Ny Turnering",
      description: "Opprett en ny dartturnering",
      icon: Plus,
      to: "/create",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
    },
    {
      title: "Aktive",
      description: `${activeTournaments.length} pågående turneringer`,
      icon: Target,
      to: "#active",
      gradient: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
    },
    {
      title: "Historikk",
      description: `${completedTournaments.length} fullførte turneringer`,
      icon: History,
      to: "#history",
      gradient: "from-muted/40 to-muted/10",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src={dartArenaLogo} alt="DartArena" className="h-48 md:h-64 w-auto" />
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Opprett turneringer, følg brackets og registrer resultater i sanntid
          </p>
        </section>

        {/* Quick Actions Carousel */}
        <section className="mb-12">
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {quickActions.map((action, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                  {action.to.startsWith("#") ? (
                    <a href={action.to}>
                      <Card className={`group cursor-pointer border-border/50 bg-gradient-to-br ${action.gradient} hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] h-full`}>
                        <CardContent className="p-6 flex flex-col h-full min-h-[160px]">
                          <div className={`w-14 h-14 rounded-xl bg-background/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <action.icon className={`w-7 h-7 ${action.iconColor}`} />
                          </div>
                          <h3 className="font-display text-xl mb-1">{action.title}</h3>
                          <p className="text-muted-foreground text-sm flex-1">{action.description}</p>
                          <div className="flex items-center text-primary mt-3 text-sm font-medium">
                            Se mer <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  ) : (
                    <Link to={action.to}>
                      <Card className={`group cursor-pointer border-border/50 bg-gradient-to-br ${action.gradient} hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] h-full`}>
                        <CardContent className="p-6 flex flex-col h-full min-h-[160px]">
                          <div className={`w-14 h-14 rounded-xl bg-background/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <action.icon className={`w-7 h-7 ${action.iconColor}`} />
                          </div>
                          <h3 className="font-display text-xl mb-1">{action.title}</h3>
                          <p className="text-muted-foreground text-sm flex-1">{action.description}</p>
                          <div className="flex items-center text-primary mt-3 text-sm font-medium">
                            Kom i gang <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <section id="active" className="mb-12 scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Aktive Turneringer
              </h2>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {activeTournaments.map((tournament) => (
                  <CarouselItem key={tournament.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                    <TournamentCard tournament={tournament} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
          </section>
        )}

        {/* Tournament History */}
        {completedTournaments.length > 0 && (
          <section id="history" className="scroll-mt-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <History className="w-6 h-6 text-accent" />
                Turneringshistorikk
              </h2>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {completedTournaments.map((tournament) => (
                  <CarouselItem key={tournament.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                    <TournamentCard tournament={tournament} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && tournaments?.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl mb-2">Ingen turneringer ennå</h3>
            <p className="text-muted-foreground mb-6">
              Opprett din første turnering for å komme i gang
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
