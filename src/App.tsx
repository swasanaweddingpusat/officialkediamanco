import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { HelmetProvider } from "react-helmet-async";
const Index = lazy(() => import("./pages/Index"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Packages = lazy(() => import("./pages/Packages"));
const VenueOnly = lazy(() => import("./pages/VenueOnly"));
const Classes = lazy(() => import("./pages/Classes"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const Trainers = lazy(() => import("./pages/Trainers"));
const PortfolioDetail = lazy(() => import("./pages/PortfolioDetail"));
const Locations = lazy(() => import("./pages/Locations"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminHero = lazy(() => import("./pages/admin/AdminHero"));
const AdminFeatures = lazy(() => import("./pages/admin/AdminFeatures"));
const AdminPrograms = lazy(() => import("./pages/admin/AdminPrograms"));
const AdminTrainers = lazy(() => import("./pages/admin/AdminTrainers"));
const AdminLocations = lazy(() => import("./pages/admin/AdminLocations"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBallroomSchedules = lazy(() => import("./pages/admin/AdminBallroomSchedules"));
const AdminBallroomBookings = lazy(() => import("./pages/admin/AdminBallroomBookings"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminVideoTestimonials = lazy(() => import("./pages/admin/AdminVideoTestimonials"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const Blog = lazy(() => import("./pages/Blog"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const BookingTrack = lazy(() => import("./pages/BookingTrack"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const PriceList = lazy(() => import("./pages/PriceList"));
const Help = lazy(() => import("./pages/Help"));
const Reviews = lazy(() => import("./pages/Reviews"));
const AdminPackages = lazy(() => import("./pages/admin/AdminPackages"));
const AdminFaqs = lazy(() => import("./pages/admin/AdminFaqs"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
import { DeferredChat } from "./components/DeferredChat";
import { RouteIndexingManager } from "./components/RouteIndexingManager";

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
            <RouteIndexingManager />
            <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}><Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/venue-only" element={<VenueOnly />} />
              <Route path="/tentang-kami" element={<Classes />} />
              <Route path="/tentang-kami/:id" element={<ProgramDetail />} />
              <Route path="/portfolio" element={<Trainers />} />
              <Route path="/portfolio/:id" element={<PortfolioDetail />} />
              <Route path="/paket" element={<Packages />} />
              <Route path="/promo" element={<Packages />} />
              <Route path="/promo/:id" element={<ProgramDetail />} />
              <Route path="/harga" element={<PriceList />} />
              <Route path="/bantuan" element={<Help />} />
              <Route path="/ulasan" element={<Reviews />} />
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
              <Route path="/admin/packages" element={<AdminPackages />} />
              <Route path="/admin/faqs" element={<AdminFaqs />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/ballroom-schedules" element={<AdminBallroomSchedules />} />
              <Route path="/admin/ballroom-bookings" element={<AdminBallroomBookings />} />
              <Route path="*" element={<NotFound />} />
            </Routes></Suspense>
            <DeferredChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
