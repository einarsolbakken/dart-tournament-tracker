import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TournamentInfoStepProps {
  name: string;
  setName: (name: string) => void;
  date: Date;
  setDate: (date: Date) => void;
}

export function TournamentInfoStep({ name, setName, date, setDate }: TournamentInfoStepProps) {
  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Turneringsinfo</h2>
        <p className="text-muted-foreground">Gi turneringen din et navn og velg dato</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-base font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Turneringsnavn
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Fredagspils Open"
            required
            className="h-12 text-lg bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 transition-all"
          />
        </div>
        
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Dato
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left text-lg font-normal bg-muted/50 border-border/50 hover:bg-muted",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                {date ? format(date, "PPP", { locale: nb }) : <span>Velg dato</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                locale={nb}
                className="pointer-events-auto rounded-md border bg-popover"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
