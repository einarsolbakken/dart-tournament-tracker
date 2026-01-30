import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { TournamentBracket } from "@/components/TournamentBracket";
import { GroupStandings } from "@/components/GroupStandings";
import { LeagueStandings } from "@/components/LeagueStandings";
import { ScoreDialog } from "@/components/ScoreDialog";
import { EditMatchDialog } from "@/components/EditMatchDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTournament, usePlayers, useMatches, useSkipMatch, useDeleteTournament, Match } from "@/hooks/useTournaments";
import { useSimulateStageMatches } from "@/hooks/useSimulateMatches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, Target, Trophy, Users, Swords, LayoutGrid, Zap, MoreVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";

const TournamentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading: tournamentLoading } = useTournament(id || "");
  const { data: players } = usePlayers(id || "");
  const { data: matches } = useMatches(id || "");
  const skipMatch = useSkipMatch();
  const simulateMatches = useSimulateStageMatches();
  const deleteTournament = useDeleteTournament();
  
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSimulateDialog, setShowSimulateDialog] = useState(false);

  if (tournamentLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!tournament) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="font-display text-2xl mb-4">Turnering ikke funnet</h2>
            <Link to="/">
              <Button>Tilbake til forsiden</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const groupMatches = matches?.filter(m => m.stage === "group") || [];
  const leagueMatches = matches?.filter(m => m.stage === "league") || [];
  const knockoutMatches = matches?.filter(m => m.stage === "knockout") || [];
  
  const isLeagueFormat = tournament.tournament_format === "league";
  const isGroupStage = tournament.current_phase === "group_stage";
  const isLeagueStage = tournament.current_phase === "league";
  const isKnockoutStage = tournament.current_phase === "knockout" || tournament.current_phase === "completed";

  // Check if there are pending matches in the current stage
  const pendingStageMatches = isLeagueFormat
    ? leagueMatches.filter(m => m.status === "pending")
    : groupMatches.filter(m => m.status === "pending");
  const canSimulate = (isGroupStage || isLeagueStage) && pendingStageMatches.length > 0;

  const handleSimulateAll = () => {
    if (!tournament || !id) return;
    setShowSimulateDialog(false);
    
    const stage = isLeagueFormat ? "league" : "group";
    const gameMode = parseInt(tournament.game_mode) || 301;
    
    simulateMatches.mutate(
      { tournamentId: id, stage, gameMode },
      {
        onSuccess: (result) => {
          toast.success(`Simulerte ${result.simulatedCount} kamper`);
        },
        onError: (error) => {
          toast.error("Kunne ikke simulere kamper");
          console.error(error);
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteTournament.mutateAsync(id);
      toast.success("Turnering slettet");
      navigate("/active");
    } catch (error) {
      toast.error("Kunne ikke slette turnering");
    }
    setShowDeleteDialog(false);
  };

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
      case "league": return "Ligaspill";
      case "knockout": return "Sluttspill";
      case "completed": return "Fullført";
      default: return tournament.current_phase;
    }
  };

  // Show full-screen loading spinner while simulating
  if (simulateMatches.isPending) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner message="Simulerer kamper..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="relative flex items-center justify-center mb-6">
            <Link to="/active" className="absolute left-0">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Button>
            </Link>
            
            {/* Tournament Menu */}
            <div className="absolute right-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canSimulate && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => setShowSimulateDialog(true)}
                        disabled={simulateMatches.isPending}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Simuler alle kamper ({pendingStageMatches.length})
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Slett turnering
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tournament Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="font-display text-4xl">{tournament.name}</h1>
              <Badge variant={tournament.status === "completed" ? "outline" : "default"}>
                {tournament.status === "completed" && <Trophy className="w-3 h-3 mr-1" />}
                {getPhaseLabel()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
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
          <Tabs defaultValue={isKnockoutStage ? "knockout" : "stage"} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="stage" className="flex items-center gap-2">
                {isLeagueFormat ? (
                  <>
                    <Trophy className="w-4 h-4" />
                    Ligaspill
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    Gruppespill
                  </>
                )}
                {(isGroupStage || isLeagueStage) && <Badge variant="secondary" className="ml-1">Pågår</Badge>}
              </TabsTrigger>
              <TabsTrigger value="knockout" className="flex items-center gap-2" disabled={!isKnockoutStage}>
                <Swords className="w-4 h-4" />
                Sluttspill
                {isKnockoutStage && tournament.status !== "completed" && (
                  <Badge variant="secondary" className="ml-1">Pågår</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stage">
              {players && isLeagueFormat ? (
                <LeagueStandings
                  players={players as any}
                  matches={leagueMatches as any}
                  onMatchClick={(match) => setSelectedMatch(match as any)}
                  onEditMatch={(match) => setEditMatch(match as any)}
                  onSkipMatch={(match) => {
                    skipMatch.mutate(
                      { matchId: match.id, tournamentId: id || "" },
                      {
                        onSuccess: () => {
                          toast.success("Kampen ble hoppet over");
                        },
                        onError: () => {
                          toast.error("Kunne ikke hoppe over kampen");
                        },
                      }
                    );
                  }}
                />
              ) : players ? (
                <GroupStandings
                  players={players as any}
                  matches={groupMatches as any}
                  onMatchClick={(match) => setSelectedMatch(match as any)}
                  onEditMatch={(match) => setEditMatch(match as any)}
                  onSkipMatch={(match) => {
                    skipMatch.mutate(
                      { matchId: match.id, tournamentId: id || "" },
                      {
                        onSuccess: () => {
                          toast.success("Kampen ble hoppet over");
                        },
                        onError: () => {
                          toast.error("Kunne ikke hoppe over kampen");
                        },
                      }
                    );
                  }}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="knockout">
              {knockoutMatches.length > 0 && players ? (
                <TournamentBracket
                  matches={knockoutMatches}
                  players={players}
                  gameMode="301"
                  tournamentId={tournament.id}
                  onMatchClick={setSelectedMatch}
                  onEditMatch={setEditMatch}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Sluttspillet starter når {isLeagueFormat ? "ligaspillet" : "gruppespillet"} er ferdig</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <ScoreDialog
          match={selectedMatch}
          players={players || []}
          tournamentId={id || ""}
          showCheckoutSuggestions={tournament?.show_checkout_suggestions ?? true}
          groupCheckoutType={tournament?.group_checkout_type ?? "single"}
          knockoutCheckoutType={tournament?.knockout_checkout_type ?? "double"}
          onClose={() => setSelectedMatch(null)}
        />

        <EditMatchDialog
          match={editMatch}
          players={players || []}
          tournamentId={id || ""}
          onClose={() => setEditMatch(null)}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Slett turnering?</AlertDialogTitle>
              <AlertDialogDescription>
                Er du sikker på at du vil slette "{tournament.name}"? Dette kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive hover:bg-destructive/90"
              >
                Slett
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Simulate Confirmation Dialog */}
        <AlertDialog open={showSimulateDialog} onOpenChange={setShowSimulateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Simuler alle kamper?</AlertDialogTitle>
              <AlertDialogDescription>
                Dette vil simulere {pendingStageMatches.length} ventende kamper med tilfeldige resultater. 
                Bruk dette kun for testing. Handlingen kan ikke angres.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Avbryt</AlertDialogCancel>
              <AlertDialogAction onClick={handleSimulateAll}>
                Simuler
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default TournamentView;
