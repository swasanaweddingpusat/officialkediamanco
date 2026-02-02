import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Image, Zap, Dumbbell, Users, MapPin, Settings, LogOut, Home, CalendarDays, CalendarCheck, FileText, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Hero Slides', href: '/admin/hero', icon: Image },
  { name: 'Features', href: '/admin/features', icon: Zap },
  { name: 'Programs', href: '/admin/programs', icon: Dumbbell },
  { name: 'Portfolio', href: '/admin/trainers', icon: Users },
  { name: 'Locations', href: '/admin/locations', icon: MapPin },
  { name: 'Articles', href: '/admin/articles', icon: FileText },
  { name: 'Video Testimonials', href: '/admin/video-testimonials', icon: Video },
  { name: 'Jadwal Ballroom', href: '/admin/ballroom-schedules', icon: CalendarDays },
  { name: 'Booking Requests', href: '/admin/ballroom-bookings', icon: CalendarCheck },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col fixed h-full">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="p-2 bg-primary rounded-lg">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl">ADMIN CMS</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 pt-4 border-t border-border">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="w-5 h-5 mr-3" />
              View Site
            </Button>
          </Link>
          <Button variant="ghost" onClick={signOut} className="w-full justify-start text-destructive hover:text-destructive">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="font-display text-4xl">{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
