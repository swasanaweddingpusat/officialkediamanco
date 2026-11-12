import { Suspense, useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { lazyPage } from "@/lib/lazy-page";
import { RouteFallback, RouteErrorBoundary } from "@/components/RouteFallback";
import { AuthProvider } from "@/hooks/useAuth";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { HelmetProvider } from "react-helmet-async";
const Index = lazyPage(() => import("./pages/Index"));
const AppInstall = lazyPage(() => import("./pages/AppInstall"));
const PrivacyPolicy = lazyPage(() => import("./pages/PrivacyPolicy"));
const AccountDelete = lazyPage(() => import("./pages/AccountDelete"));
const LandingPage = lazyPage(() => import("./pages/LandingPage"));
const Packages = lazyPage(() => import("./pages/Packages"));
const VenueOnly = lazyPage(() => import("./pages/VenueOnly"));
const Classes = lazyPage(() => import("./pages/Classes"));
const ProgramDetail = lazyPage(() => import("./pages/ProgramDetail"));
const Trainers = lazyPage(() => import("./pages/Trainers"));
const PortfolioDetail = lazyPage(() => import("./pages/PortfolioDetail"));
const Locations = lazyPage(() => import("./pages/Locations"));
const LocationDetail = lazyPage(() => import("./pages/LocationDetail"));
const Auth = lazyPage(() => import("./pages/Auth"));
const Admin = lazyPage(() => import("./pages/Admin"));
const AdminHero = lazyPage(() => import("./pages/admin/AdminHero"));
const AdminFeatures = lazyPage(() => import("./pages/admin/AdminFeatures"));
const AdminPrograms = lazyPage(() => import("./pages/admin/AdminPrograms"));
const AdminTrainers = lazyPage(() => import("./pages/admin/AdminTrainers"));
const AdminLocations = lazyPage(() => import("./pages/admin/AdminLocations"));
const AdminSettings = lazyPage(() => import("./pages/admin/AdminSettings"));
const AdminBallroomSchedules = lazyPage(() => import("./pages/admin/AdminBallroomSchedules"));
const AdminBallroomBookings = lazyPage(() => import("./pages/admin/AdminBallroomBookings"));
const AdminArticles = lazyPage(() => import("./pages/admin/AdminArticles"));
const AdminVideoTestimonials = lazyPage(() => import("./pages/admin/AdminVideoTestimonials"));
const AdminAbout = lazyPage(() => import("./pages/admin/AdminAbout"));
const Blog = lazyPage(() => import("./pages/Blog"));
const ArticleDetail = lazyPage(() => import("./pages/ArticleDetail"));
const BookingTrack = lazyPage(() => import("./pages/BookingTrack"));
const NotFound = lazyPage(() => import("./pages/NotFound"));
const OAuthConsent = lazyPage(() => import("./pages/OAuthConsent"));
const PriceList = lazyPage(() => import("./pages/PriceList"));
const Help = lazyPage(() => import("./pages/Help"));
const Reviews = lazyPage(() => import("./pages/Reviews"));
const AdminPackages = lazyPage(() => import("./pages/admin/AdminPackages"));
const AdminFaqs = lazyPage(() => import("./pages/admin/AdminFaqs"));
const AdminReviews = lazyPage(() => import("./pages/admin/AdminReviews"));
const AdminNewsletter = lazyPage(() => import("./pages/admin/AdminNewsletter"));
const Unsubscribe = lazyPage(() => import("./pages/Unsubscribe"));
const Rewards = lazyPage(() => import("./pages/Rewards"));
const Careers = lazyPage(() => import("./pages/Careers"));
const CareerDetail = lazyPage(() => import("./pages/CareerDetail"));
const AdminCareers = lazyPage(() => import("./pages/admin/AdminCareers"));
const AdminLoyalty = lazyPage(() => import("./pages/admin/AdminLoyalty"));
import { DeferredChat } from "./components/DeferredChat";
import { RouteIndexingManager } from "./components/RouteIndexingManager";

const queryClient = new QueryClient();

function FaviconManager() {
  useDynamicFavicon();
  return null;
}

const LegacyLocationRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/lokasi/${id ?? ''}`} replace />;
};

// Muat halaman yang paling sering dibuka di latar belakang (setelah halaman pertama tampil),
// supaya pindah halaman terasa instan dan tidak menunggu unduhan.
function PrefetchPages() {
  useEffect(() => {
    const run = () => [Locations, LocationDetail, Index, PriceList, Packages, Blog, ArticleDetail, Trainers, Reviews, Help, Classes, BookingTrack]
      .forEach((p, i) => setTimeout(() => p.preload(), i * 250));
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const t = window.setTimeout(() => (w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 4000 }) : run()), 2500);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

function AppRoutes({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <RouteErrorBoundary resetKey={pathname}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <FaviconManager />
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RouteIndexingManager />
            <PrefetchPages />
            <AppRoutes><Routes>
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
              <Route path="/aplikasi" element={<AppInstall />} />
              <Route path="/kebijakan-privasi" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/hapus-akun" element={<AccountDelete />} />
              <Route path="/bantuan" element={<Help />} />
              <Route path="/ulasan" element={<Reviews />} />
              <Route path="/lokasi" element={<Locations />} />
              <Route path="/lokasi/:id" element={<LocationDetail />} />
              {/* URL lama (bahasa Inggris) → halaman venue */}
              <Route path="/locations" element={<Navigate to="/lokasi" replace />} />
              <Route path="/locations/:id" element={<LegacyLocationRedirect />} />
              <Route path="/artikel" element={<Blog />} />
              <Route path="/artikel/:slug" element={<ArticleDetail />} />
              <Route path="/booking/track" element={<BookingTrack />} />
              <Route path="/berhenti-langganan" element={<Unsubscribe />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/karir" element={<Careers />} />
              <Route path="/karir/:slug" element={<CareerDetail />} />
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
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/loyalty" element={<AdminLoyalty />} />
              <Route path="/admin/careers" element={<AdminCareers />} />
              <Route path="/admin/ballroom-schedules" element={<AdminBallroomSchedules />} />
              <Route path="/admin/ballroom-bookings" element={<AdminBallroomBookings />} />
              <Route path="*" element={<NotFound />} />
            </Routes></AppRoutes>
            <DeferredChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
