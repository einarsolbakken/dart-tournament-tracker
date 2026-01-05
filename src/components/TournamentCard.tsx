import { Tournament } from "@/hooks/useTournaments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const statusConfig = {
    pending: { label: "Venter", variant: "secondary" as const },
    active: { label: "Pågår", variant: "default" as const },
    completed: { label: "Fullført", variant: "outline" as const },
  };

  const status = statusConfig[tournament.status as keyof typeof statusConfig];

  return (
    <Link to={`/tournament/${tournament.id}`}>
      <Card className="hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-display text-xl group-hover:text-primary transition-colors">
              {tournament.name}
            </h3>
            <Badge
              variant={status.variant}
              className={cn(
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
      </Card>
    </Link>
  );
}
