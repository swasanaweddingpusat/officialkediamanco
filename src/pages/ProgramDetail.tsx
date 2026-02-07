import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { usePrograms } from '@/hooks/useCMS';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Users } from 'lucide-react';
import pilatesImage from '@/assets/pilates-class.jpg';
import hiitImage from '@/assets/hiit-class.jpg';
import gymInterior from '@/assets/gym-interior.jpg';

const fallbackImages = [pilatesImage, hiitImage, gymInterior];

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: programs, isLoading } = usePrograms();

  const program = programs?.find(p => p.id === id);
  const programIndex = programs?.findIndex(p => p.id === id) || 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout>
        <div className="pt-20 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl mb-4 font-bold">Program Not Found</h1>
            <p className="text-muted-foreground mb-8">The program you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/classes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Special Offers
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Image */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={program.image_url || fallbackImages[programIndex % fallbackImages.length]}
          alt={program.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-24 left-4 md:left-8"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/classes')}
            className="backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </motion.div>

        {/* Category Badge */}
        {program.category && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-4 md:left-8"
          >
            <span className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-sm text-primary text-sm rounded-full">
              {program.category}
            </span>
          </motion.div>
        )}
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="font-serif text-4xl md:text-6xl mb-6 font-bold">
                <span className="text-primary">{program.name}</span>
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                {program.description || 'Discover our exclusive program designed to help you achieve your fitness goals.'}
              </p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            >
              <div className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Availability</p>
                  <p className="font-medium">Flexible Schedule</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">Varies by Program</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">Limited Spots</p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <Button size="lg" className="w-full md:w-auto">
                Get This Offer
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProgramDetail;
