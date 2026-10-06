import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const isVenueDetail = pathname.startsWith('/lokasi/');
  return (
    <div className={`min-h-screen flex flex-col ${isVenueDetail ? '' : 'editorial-site'}`}>
      <Navbar />
      <main className="flex-1 pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
