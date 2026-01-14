import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { Header } from "@/components/Header";
import { History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TournamentHistory = () => {
  const { data: tournaments, isLoading } = useTournaments();
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

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
            <History className="w-8 h-8 text-accent" />
            Turneringshistorikk
          </h1>
          <p className="text-muted-foreground mt-2">
            {completedTournaments.length} fullførte turneringer
          </p>
        </div>

        {completedTournaments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <History className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl mb-2">Ingen fullførte turneringer</h3>
            <p className="text-muted-foreground">
              Fullførte turneringer vil vises her
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

export default TournamentHistory;
