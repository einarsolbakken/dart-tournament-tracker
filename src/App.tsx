import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateTournament from "./pages/CreateTournament";
import TournamentView from "./pages/TournamentView";
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
          <Route path="/tournament/:id" element={<TournamentView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
