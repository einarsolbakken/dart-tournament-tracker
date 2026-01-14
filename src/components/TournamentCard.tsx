import { Tournament, useDeleteTournament } from "@/hooks/useTournaments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trophy, MoreVertical, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const deleteTournament = useDeleteTournament();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const statusConfig = {
    pending: { label: "Venter", variant: "secondary" as const },
    active: { label: "Pågår", variant: "default" as const },
    completed: { label: "Fullført", variant: "outline" as const },
  };

  const status = statusConfig[tournament.status as keyof typeof statusConfig];

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteTournament.mutateAsync(tournament.id);
      toast.success("Turnering slettet");
    } catch (error) {
      toast.error("Kunne ikke slette turnering");
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer group relative">
        <Link to={`/tournament/${tournament.id}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display text-xl group-hover:text-primary transition-colors pr-16">
                {tournament.name}
              </h3>
              <Badge
                variant={status.variant}
                className={cn(
                  "mr-8",
                  tournament.status === "completed" && "bg-accent/20 text-accent border-accent/50"
                )}
              >
                {tournament.status === "completed" && <Trophy className="w-3 h-3 mr-1" />}
                {status.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(new Date(tournament.date), "d. MMMM yyyy", { locale: nb })}
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {tournament.game_mode}
              </div>
            </div>
          </CardContent>
        </Link>
        
        {/* Menu button positioned absolutely */}
        <div className="absolute top-3 right-3" onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Slett turnering
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slett turnering?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette "{tournament.name}"? Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
