import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { Header } from "@/components/Header";
import { Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ActiveTournaments = () => {
  const { data: tournaments, isLoading } = useTournaments();
  const activeTournaments = tournaments?.filter((t) => t.status !== "completed") || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
          </Link>
          <h1 className="font-display text-3xl flex items-center gap-3">
            <Target className="w-8 h-8 text-primary" />
            Aktive Turneringer
          </h1>
          <p className="text-muted-foreground mt-2">
            {activeTournaments.length} pågående turneringer
          </p>
        </div>

        {activeTournaments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl mb-2">Ingen aktive turneringer</h3>
            <p className="text-muted-foreground mb-6">
              Opprett en ny turnering for å komme i gang
            </p>
            <Link to="/create">
              <Button>Opprett Turnering</Button>
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

export default ActiveTournaments;
