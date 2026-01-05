import { Header } from "@/components/Header";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const CreateTournament = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake
          </Button>
        </Link>
        
        <CreateTournamentForm />
      </main>
    </div>
  );
};

export default CreateTournament;
