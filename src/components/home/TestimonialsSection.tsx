import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useTestimonials } from '@/hooks/useCMS';

export function TestimonialsSection() {
  const { data: testimonials, isLoading } = useTestimonials();

  const activeTestimonials = testimonials?.filter(t => t.is_active) || [];

  if (isLoading) {
    return (
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 w-48 bg-muted animate-pulse mx-auto mb-4 rounded" />
            <div className="h-12 w-96 bg-muted animate-pulse mx-auto rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card p-8 rounded-2xl">
                <div className="h-24 bg-muted animate-pulse rounded mb-6" />
                <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeTestimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-script text-primary text-3xl md:text-4xl mb-4 block">
            Testimoni
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight">
            Kata Mereka Tentang Kami
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTestimonials.slice(0, 6).map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card-luxury p-8 rounded-2xl relative group"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/20 group-hover:text-primary/40 transition-colors" />

              {/* Rating */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating!
                          ? 'text-primary fill-primary'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                {testimonial.photo_url ? (
                  <img
                    src={testimonial.photo_url}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-display text-xl">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-display text-lg font-semibold">
                    {testimonial.name}
                  </h4>
                  {testimonial.role && (
                    <p className="text-sm text-muted-foreground">
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
