import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { Header } from "@/components/Header";
import { Plus, Trophy, Target, History } from "lucide-react";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";

const Index = () => {
  const { data: tournaments, isLoading } = useTournaments();

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Compact Hero */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 py-4">
          <div className="flex items-center gap-6">
            <img src={dartArenaLogo} alt="DartArena" className="h-20 md:h-24 w-auto" />
            <div className="hidden md:block">
              <p className="text-muted-foreground text-sm max-w-xs">
                Opprett turneringer, følg brackets og registrer resultater i sanntid
              </p>
            </div>
          </div>
          <Link to="/create">
            <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="w-5 h-5 mr-2" />
              Ny Turnering
            </Button>
          </Link>
        </section>

        {/* Quick Stats Bar - shows when there are tournaments */}
        {tournaments && tournaments.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card/50 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{activeTournaments.length}</div>
              <div className="text-xs text-muted-foreground">Aktive</div>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">{completedTournaments.length}</div>
              <div className="text-xs text-muted-foreground">Fullførte</div>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{tournaments.length}</div>
              <div className="text-xs text-muted-foreground">Totalt</div>
            </div>
          </div>
        )}

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <section className="mb-6">
            <h2 className="font-display text-lg mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Aktive Turneringer
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTournaments.map((tournament, index) => (
                <div 
                  key={tournament.id} 
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tournament History */}
        {completedTournaments.length > 0 && (
          <section>
            <h2 className="font-display text-lg mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-accent" />
              Turneringshistorikk
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {completedTournaments.map((tournament, index) => (
                <div 
                  key={tournament.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State - More compact */}
        {!isLoading && tournaments?.length === 0 && (
          <div className="text-center py-12 bg-card/30 rounded-xl border border-border/50">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl mb-2">Ingen turneringer ennå</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Opprett din første turnering for å komme i gang
            </p>
            <Link to="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Opprett Turnering
              </Button>
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
