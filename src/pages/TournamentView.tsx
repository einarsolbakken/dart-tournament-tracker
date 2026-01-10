import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { TournamentBracket } from "@/components/TournamentBracket";
import { GroupStandings } from "@/components/GroupStandings";
import { ScoreDialog } from "@/components/ScoreDialog";
import { useTournament, usePlayers, useMatches, Match } from "@/hooks/useTournaments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Target, Trophy, Users, Swords } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

const TournamentView = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(id || "");
  const { data: players } = usePlayers(id || "");
  const { data: matches } = useMatches(id || "");
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

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

  const groupMatches = matches?.filter(m => m.stage === "group") || [];
  const knockoutMatches = matches?.filter(m => m.stage === "knockout") || [];
  const isGroupStage = tournament.current_phase === "group_stage";
  const isKnockoutStage = tournament.current_phase === "knockout" || tournament.current_phase === "completed";

  // Find winner if tournament is completed
  const winner = tournament.status === "completed" && knockoutMatches.length > 0 && players
    ? (() => {
        const finalMatch = knockoutMatches.find(m => m.round === Math.max(...knockoutMatches.map(m => m.round)));
        return finalMatch?.winner_id ? players.find(p => p.id === finalMatch.winner_id) : null;
      })()
    : null;

  const getPhaseLabel = () => {
    switch (tournament.current_phase) {
      case "group_stage": return "Gruppespill";
      case "knockout": return "Sluttspill";
      case "completed": return "Fullført";
      default: return tournament.current_phase;
    }
  };

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
        </div>

        {/* Tournament Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl">{tournament.name}</h1>
            <Badge variant={tournament.status === "completed" ? "outline" : "default"}>
              {tournament.status === "completed" && <Trophy className="w-3 h-3 mr-1" />}
              {getPhaseLabel()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(tournament.date), "d. MMMM yyyy", { locale: nb })}
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              301
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
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

        {/* Tournament Tabs */}
        <Tabs defaultValue={isKnockoutStage ? "knockout" : "groups"} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gruppespill
              {isGroupStage && <Badge variant="secondary" className="ml-1">Pågår</Badge>}
            </TabsTrigger>
            <TabsTrigger value="knockout" className="flex items-center gap-2" disabled={!isKnockoutStage}>
              <Swords className="w-4 h-4" />
              Sluttspill
              {isKnockoutStage && tournament.status !== "completed" && (
                <Badge variant="secondary" className="ml-1">Pågår</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups">
            {players && (
              <GroupStandings
                players={players as any}
                matches={groupMatches as any}
                onMatchClick={(match) => setSelectedMatch(match as any)}
              />
            )}
          </TabsContent>

          <TabsContent value="knockout">
            {knockoutMatches.length > 0 && players ? (
              <TournamentBracket
                matches={knockoutMatches}
                players={players}
                gameMode="301"
                tournamentId={tournament.id}
                onMatchClick={setSelectedMatch}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sluttspillet starter når gruppespillet er ferdig</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
