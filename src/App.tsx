import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Packages from "./pages/Packages";
import VenueOnly from "./pages/VenueOnly";
import Classes from "./pages/Classes";
import ProgramDetail from "./pages/ProgramDetail";
import Trainers from "./pages/Trainers";
import PortfolioDetail from "./pages/PortfolioDetail";
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
import AdminBallroomBookings from "./pages/admin/AdminBallroomBookings";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminVideoTestimonials from "./pages/admin/AdminVideoTestimonials";
import AdminAbout from "./pages/admin/AdminAbout";
import Blog from "./pages/Blog";
import ArticleDetail from "./pages/ArticleDetail";
import BookingTrack from "./pages/BookingTrack";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import { FloatingChat } from "./components/FloatingChat";

const queryClient = new QueryClient();

function FaviconManager() {
  useDynamicFavicon();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <FaviconManager />
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/venue-only" element={<VenueOnly />} />
              <Route path="/tentang-kami" element={<Classes />} />
              <Route path="/tentang-kami/:id" element={<ProgramDetail />} />
              <Route path="/portfolio" element={<Trainers />} />
              <Route path="/portfolio/:id" element={<PortfolioDetail />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/paket" element={<Packages />} />
              <Route path="/lokasi" element={<Locations />} />
              <Route path="/lokasi/:id" element={<LocationDetail />} />
              <Route path="/artikel" element={<Blog />} />
              <Route path="/artikel/:slug" element={<ArticleDetail />} />
              <Route path="/booking/track" element={<BookingTrack />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/hero" element={<AdminHero />} />
              <Route path="/admin/features" element={<AdminFeatures />} />
              <Route path="/admin/programs" element={<AdminPrograms />} />
              <Route path="/admin/trainers" element={<AdminTrainers />} />
              <Route path="/admin/locations" element={<AdminLocations />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/articles" element={<AdminArticles />} />
              <Route path="/admin/video-testimonials" element={<AdminVideoTestimonials />} />
              <Route path="/admin/about" element={<AdminAbout />} />
              <Route path="/admin/ballroom-schedules" element={<AdminBallroomSchedules />} />
              <Route path="/admin/ballroom-bookings" element={<AdminBallroomBookings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
