import { AppLayout } from "@/components/AppLayout";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreateTournament = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
          </Link>
          
          <CreateTournamentForm />
        </main>
      </div>
    </AppLayout>
  );
};

export default CreateTournament;
