import { Link } from "react-router-dom";
import { useTournaments } from "@/hooks/useTournaments";
import { TournamentCard } from "@/components/TournamentCard";
import { AppLayout } from "@/components/AppLayout";
import { History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TournamentHistory = () => {
  const { data: tournaments, isLoading } = useTournaments();
  const completedTournaments = tournaments?.filter((t) => t.status === "completed") || [];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-8">
            <Link to="/" className="absolute left-0">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                <History className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <h1 className="font-display text-2xl">Turneringshistorikk</h1>
                <p className="text-muted-foreground text-sm">{completedTournaments.length} fullførte</p>
              </div>
            </div>
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
    </AppLayout>
  );
};

export default TournamentHistory;
