import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { useHeroSlides, useFeatures, usePrograms, useTrainers, useLocations, useArticles, useAllVideoTestimonials } from '@/hooks/useCMS';
import { Image, Zap, Dumbbell, Users, MapPin, ArrowRight, FileText, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

const Admin = () => {
  const { data: slides } = useHeroSlides();
  const { data: features } = useFeatures();
  const { data: programs } = usePrograms();
  const { data: trainers } = useTrainers();
  const { data: locations } = useLocations();
  const { data: articles } = useArticles();
  const { data: videoTestimonials } = useAllVideoTestimonials();

  const stats = [
    { name: 'Hero Slides', count: slides?.length || 0, icon: Image, href: '/admin/hero', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Features', count: features?.length || 0, icon: Zap, href: '/admin/features', color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Programs', count: programs?.length || 0, icon: Dumbbell, href: '/admin/programs', color: 'bg-green-500/10 text-green-500' },
    { name: 'Portfolio', count: trainers?.length || 0, icon: Users, href: '/admin/trainers', color: 'bg-purple-500/10 text-purple-500' },
    { name: 'Locations', count: locations?.length || 0, icon: MapPin, href: '/admin/locations', color: 'bg-red-500/10 text-red-500' },
    { name: 'Articles', count: articles?.length || 0, icon: FileText, href: '/admin/articles', color: 'bg-cyan-500/10 text-cyan-500' },
    { name: 'Video Testimonials', count: videoTestimonials?.length || 0, icon: Video, href: '/admin/video-testimonials', color: 'bg-pink-500/10 text-pink-500' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="p-6 hover:border-primary/50 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-muted-foreground text-sm">{stat.name}</p>
              <p className="font-serif text-3xl font-bold">{stat.count}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-4 font-bold">Welcome to Admin CMS</h2>
          <p className="text-muted-foreground mb-4">
            Gunakan menu di sidebar untuk mengelola konten website Anda:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              <span><strong>Hero Slides</strong> - Slider gambar di halaman utama</span>
            </li>
            <li className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span><strong>Features</strong> - Keunggulan gym Anda</span>
            </li>
            <li className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span><strong>Programs</strong> - Kelas dan program fitness</span>
            </li>
            <li className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span><strong>Portfolio</strong> - Our portfolio items</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span><strong>Locations</strong> - Lokasi cabang gym</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-serif text-2xl mb-4 font-bold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/hero" className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-center">
              <Image className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Add Slide</span>
            </Link>
            <Link to="/admin/programs" className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-center">
              <Dumbbell className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Add Program</span>
            </Link>
            <Link to="/admin/trainers" className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-center">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Add Portfolio</span>
            </Link>
            <Link to="/admin/locations" className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">Add Location</span>
            </Link>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Admin;
