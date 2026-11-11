import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { InstallAppBanner } from '@/components/pwa/InstallApp';
import { useOtaTheme } from '@/hooks/useOtaTheme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useOtaTheme(true);
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
      <InstallAppBanner />
    </div>
  );
}
