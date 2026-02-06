import { motion } from 'framer-motion';
import { useVideoTestimonials } from '@/hooks/useCMS';
import { Star } from 'lucide-react';

export function TestimonialsSection() {
  const { data: testimonials } = useVideoTestimonials();
  const activeTestimonials = testimonials?.slice(0, 6) || [];

  if (!activeTestimonials.length) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-background to-card/30">
      <div className="container mx-auto px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 font-bold tracking-tight">
            TESTIMONI <span className="text-primary">KLIEN</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Dengarkan pengalaman nyata dari klien-klien kami yang puas
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {activeTestimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-video bg-muted border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              {/* Thumbnail with Play Button */}
              <div className="relative w-full h-full">
                {testimonial.thumbnail_url && (
                  <img
                    src={testimonial.thumbnail_url}
                    alt={testimonial.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-5 md:p-6">
                  {/* Play button */}
                  <div className="flex justify-center items-center h-full">
                    <button
                      onClick={() => window.open(testimonial.video_url, '_blank')}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center transition-all transform hover:scale-110"
                    >
                      <div className="w-0 h-0 border-l-8 border-l-primary-foreground border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
                    </button>
                  </div>

                  {/* Info at bottom */}
                  <div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-3 h-3 sm:w-4 sm:h-4 fill-primary text-primary"
                        />
                      ))}
                    </div>
                    <h3 className="font-serif text-sm sm:text-base md:text-lg font-bold text-white mb-0.5">
                      {testimonial.name}
                    </h3>
                    {testimonial.role && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    )}
                  </div>
                </div>

                {/* Static Display (non-hover) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 bg-gradient-to-t from-black/80 to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1">
                    {testimonial.name}
                  </h3>
                  {testimonial.role && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {testimonial.role}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
