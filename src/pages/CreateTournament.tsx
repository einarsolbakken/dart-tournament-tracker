import { AppLayout } from "@/components/AppLayout";
import { CreateTournamentForm } from "@/components/CreateTournamentForm";

const CreateTournament = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-4 max-w-2xl">
          <CreateTournamentForm />
        </main>
      </div>
    </AppLayout>
  );
};

export default CreateTournament;
