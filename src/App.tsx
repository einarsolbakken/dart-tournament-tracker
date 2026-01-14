import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateTournament from "./pages/CreateTournament";
import TournamentView from "./pages/TournamentView";
import ActiveTournaments from "./pages/ActiveTournaments";
import TournamentHistory from "./pages/TournamentHistory";
import BullOff from "./pages/BullOff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get base path for GitHub Pages (set during build) or default to "/"
const basename = import.meta.env.BASE_URL || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateTournament />} />
          <Route path="/active" element={<ActiveTournaments />} />
          <Route path="/history" element={<TournamentHistory />} />
          <Route path="/bull-off" element={<BullOff />} />
          <Route path="/tournament/:id" element={<TournamentView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
