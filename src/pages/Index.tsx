import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { Header } from "@/components/Header";
import { Plus, Trophy, Target, History } from "lucide-react";

const Index = () => {
  const { data: tournaments, isLoading } = useTournaments();

  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary mb-4">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium">Dart Tournament Manager</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl mb-4 tracking-tight">
            DARTARENA
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
            Opprett turneringer, følg brackets og registrer resultater i sanntid
          </p>
          <Link to="/create">
            <Button size="lg" className="text-lg px-8">
              <Plus className="w-5 h-5 mr-2" />
              Ny Turnering
            </Button>
          </Link>
        </section>

        {/* Active Tournaments */}
        {activeTournaments.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Aktive Turneringer
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </section>
        )}

        {/* Tournament History */}
        {completedTournaments.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-accent" />
              Turneringshistorikk
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
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
            <Link to="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Opprett Turnering
              </Button>
            </Link>
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
