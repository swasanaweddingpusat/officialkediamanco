import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { useHeroSlides, usePrograms, useTrainers, useLocations } from '@/hooks/useCMS';
import { Image, Dumbbell, Users, MapPin } from 'lucide-react';

const Admin = () => {
  const { data: slides } = useHeroSlides();
  const { data: programs } = usePrograms();
  const { data: trainers } = useTrainers();
  const { data: locations } = useLocations();

  const stats = [
    { name: 'Hero Slides', count: slides?.length || 0, icon: Image },
    { name: 'Programs', count: programs?.length || 0, icon: Dumbbell },
    { name: 'Trainers', count: trainers?.length || 0, icon: Users },
    { name: 'Locations', count: locations?.length || 0, icon: MapPin },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.name}</p>
                <p className="font-display text-3xl">{stat.count}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="font-display text-xl mb-4">Welcome to Admin Dashboard</h2>
        <p className="text-muted-foreground">Use the sidebar to manage your website content. You can edit hero slides, programs, trainers, locations, and site settings.</p>
      </Card>
    </AdminLayout>
  );
};

export default Admin;
