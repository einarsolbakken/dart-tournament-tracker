import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { TournamentBracket } from "@/components/TournamentBracket";
import { ScoreDialog } from "@/components/ScoreDialog";
import { useTournament, usePlayers, useMatches, Match, useDeleteTournament } from "@/hooks/useTournaments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Target, Trophy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TournamentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(id || "");
  const { data: players } = usePlayers(id || "");
  const { data: matches } = useMatches(id || "");
  const deleteTournament = useDeleteTournament();
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteTournament.mutateAsync(id);
      toast.success("Turnering slettet");
      navigate("/");
    } catch (error) {
      toast.error("Kunne ikke slette turnering");
    }
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-2xl mb-4">Turnering ikke funnet</h2>
          <Link to="/">
            <Button>Tilbake til forsiden</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Find winner if tournament is completed
  const winner = tournament.status === "completed" && matches && players
    ? (() => {
        const finalMatch = matches.find(m => m.round === Math.max(...matches.map(m => m.round)));
        return finalMatch?.winner_id ? players.find(p => p.id === finalMatch.winner_id) : null;
      })()
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Slett
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Slett turnering?</AlertDialogTitle>
                <AlertDialogDescription>
                  Er du sikker på at du vil slette denne turneringen? Dette kan ikke angres.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Slett
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Tournament Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl">{tournament.name}</h1>
            <Badge variant={tournament.status === "completed" ? "outline" : "default"}>
              {tournament.status === "completed" && <Trophy className="w-3 h-3 mr-1" />}
              {tournament.status === "pending" ? "Venter" : tournament.status === "active" ? "Pågår" : "Fullført"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.date), "d. MMMM yyyy", { locale: nb })}
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              {tournament.game_mode}
            </div>
            <div className="flex items-center gap-1.5">
              {players?.length || 0} spillere
            </div>
          </div>
        </div>

        {/* Winner Banner */}
        {winner && (
          <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 border border-accent/30 rounded-lg p-6 mb-8 text-center">
            <Trophy className="w-12 h-12 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Vinner</p>
            <h2 className="font-display text-3xl text-accent">{winner.name}</h2>
          </div>
        )}

        {/* Bracket */}
        {matches && players && (
          <TournamentBracket
            matches={matches}
            players={players}
            gameMode={tournament.game_mode}
            tournamentId={tournament.id}
            onMatchClick={setSelectedMatch}
          />
        )}
      </main>

      <ScoreDialog
        match={selectedMatch}
        players={players || []}
        tournamentId={id || ""}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
};

export default TournamentView;
