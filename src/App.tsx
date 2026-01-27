import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import Index from "./pages/Index";
import Classes from "./pages/Classes";
import ProgramDetail from "./pages/ProgramDetail";
import Trainers from "./pages/Trainers";
import Locations from "./pages/Locations";
import LocationDetail from "./pages/LocationDetail";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminHero from "./pages/admin/AdminHero";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminTrainers from "./pages/admin/AdminTrainers";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBallroomSchedules from "./pages/admin/AdminBallroomSchedules";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function FaviconManager() {
  useDynamicFavicon();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FaviconManager />
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ProgramDetail />} />
            <Route path="/trainers" element={<Trainers />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/:id" element={<LocationDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/hero" element={<AdminHero />} />
            <Route path="/admin/features" element={<AdminFeatures />} />
            <Route path="/admin/programs" element={<AdminPrograms />} />
            <Route path="/admin/trainers" element={<AdminTrainers />} />
            <Route path="/admin/locations" element={<AdminLocations />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/ballroom-schedules" element={<AdminBallroomSchedules />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
