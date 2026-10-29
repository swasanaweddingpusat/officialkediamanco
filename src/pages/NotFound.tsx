import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="ota-container py-20 text-center">
        <p className="text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">Mungkin tautannya sudah berubah. Coba mulai dari pencarian venue.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold">Ke beranda</Link>
          <Link to="/lokasi" className="inline-flex items-center h-11 px-5 rounded-xl border border-input font-bold">Cari venue</Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
