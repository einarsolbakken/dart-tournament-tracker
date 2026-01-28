import { AppLayout } from "@/components/AppLayout";
import { CreateTournamentWizard } from "@/components/TournamentWizard";

const CreateTournament = () => {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <main className="py-6">
          <CreateTournamentWizard />
        </main>
      </div>
    </AppLayout>
  );
};

export default CreateTournament;
