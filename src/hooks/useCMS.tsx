import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Testimonials
export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Video Testimonials
export function useVideoTestimonials() {
  return useQuery({
    queryKey: ['video-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllVideoTestimonials() {
  return useQuery({
    queryKey: ['video-testimonials-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_testimonials')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateVideoTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testimonial: { 
      name: string; 
      role?: string; 
      video_url: string; 
      thumbnail_url?: string;
      is_active?: boolean;
      sort_order?: number;
    }) => {
      const { error } = await supabase.from('video_testimonials').insert(testimonial);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['video-testimonials-all'] });
      toast.success('Video testimonial created');
    },
    onError: () => toast.error('Failed to create video testimonial'),
  });
}

export function useUpdateVideoTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('video_testimonials').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['video-testimonials-all'] });
      toast.success('Video testimonial updated');
    },
    onError: () => toast.error('Failed to update video testimonial'),
  });
}

export function useDeleteVideoTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('video_testimonials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['video-testimonials-all'] });
      toast.success('Video testimonial deleted');
    },
    onError: () => toast.error('Failed to delete video testimonial'),
  });
}

// Hero Slides
export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('hero_slides').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success('Hero slide updated');
    },
    onError: () => toast.error('Failed to update hero slide'),
  });
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slide: { title: string; subtitle?: string; image_url?: string; button_text?: string; button_link?: string }) => {
      const { error } = await supabase.from('hero_slides').insert(slide);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success('Hero slide created');
    },
    onError: () => toast.error('Failed to create hero slide'),
  });
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success('Hero slide deleted');
    },
    onError: () => toast.error('Failed to delete hero slide'),
  });
}

// Features
export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('features').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature updated');
    },
    onError: () => toast.error('Failed to update feature'),
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feature: { title: string; description?: string; icon?: string }) => {
      const { error } = await supabase.from('features').insert(feature);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature created');
    },
    onError: () => toast.error('Failed to create feature'),
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('features').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature deleted');
    },
    onError: () => toast.error('Failed to delete feature'),
  });
}

// Programs
export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('programs').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program updated');
    },
    onError: () => toast.error('Failed to update program'),
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: { name: string; description?: string; image_url?: string; category?: string }) => {
      const { error } = await supabase.from('programs').insert(program);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program created');
    },
    onError: () => toast.error('Failed to create program'),
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      toast.success('Program deleted');
    },
    onError: () => toast.error('Failed to delete program'),
  });
}

// Trainers
export function useTrainers() {
  return useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*, locations(name)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTrainerById(id?: string) {
  return useQuery({
    queryKey: ['trainer', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*, locations(id, name)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('trainers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios-by-location'] });
      toast.success('Portfolio updated');
    },
    onError: () => toast.error('Failed to update portfolio'),
  });
}

export function useCreateTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainer: { name: string; specialization?: string; bio?: string; photo_url?: string; instagram?: string; certifications?: string[]; images?: string[]; location_id?: string | null; sort_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from('trainers').insert(trainer);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios-by-location'] });
      toast.success('Portfolio created');
    },
    onError: () => toast.error('Failed to create portfolio'),
  });
}

// Portfolios by Location
export function usePortfoliosByLocation(locationId?: string) {
  return useQuery({
    queryKey: ['portfolios-by-location', locationId],
    enabled: !!locationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useDeleteTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trainers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success('Trainer deleted');
    },
    onError: () => toast.error('Failed to delete trainer'),
  });
}

// Locations
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('locations').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location updated');
    },
    onError: () => toast.error('Failed to update location'),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: { name: string; address?: string; phone?: string; email?: string; google_maps_url?: string; image_url?: string; facilities?: string[]; is_coming_soon?: boolean; sort_order?: number; is_active?: boolean }) => {
      const { error } = await supabase.from('locations').insert(location);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location created');
    },
    onError: () => toast.error('Failed to create location'),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted');
    },
    onError: () => toast.error('Failed to delete location'),
  });
}

// Site Settings
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('site_settings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings updated');
    },
    onError: () => toast.error('Failed to update settings'),
  });
}

// Venue Sessions (slot jadwal)
export function useVenueSessions(locationId?: string) {
  return useQuery({
    queryKey: ['venue-sessions', locationId],
    queryFn: async () => {
      let query = supabase
        .from('venue_sessions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('start_time', { ascending: true });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!locationId,
  });
}

// Ballroom Schedules

export function useBallroomSchedules(locationId?: string) {
  return useQuery({
    queryKey: ['ballroom-schedules', locationId],
    queryFn: async () => {
      let query = supabase
        .from('ballroom_schedules')
        .select('*')
        .order('schedule_date', { ascending: true });
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: locationId !== undefined,
  });
}

export type VenueInterestSummary = {
  locationId: string;
  views: number;
  dates: Record<string, { clicks: number; bookings: number }>;
};

const getVisitorKey = () => {
  const storageKey = 'kediaman-visitor-key';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(storageKey, created);
  return created;
};

export function useVenueInterest(locationId?: string) {
  return useQuery({
    queryKey: ['venue-interest', locationId || 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_venue_interest', {
        _location_id: locationId || undefined,
      });
      if (error) throw error;

      return (data || []).reduce<Record<string, VenueInterestSummary>>((acc, row) => {
        const current = acc[row.location_id] || { locationId: row.location_id, views: 0, dates: {} };
        current.views = Math.max(current.views, Number(row.view_count || 0));
        if (row.schedule_date) {
          current.dates[row.schedule_date] = {
            clicks: Number(row.date_click_count || 0),
            bookings: Number(row.booking_count || 0),
          };
        }
        acc[row.location_id] = current;
        return acc;
      }, {});
    },
    staleTime: 60_000,
  });
}

export function useTrackVenueInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      locationId,
      eventType,
      scheduleDate,
    }: {
      locationId: string;
      eventType: 'venue_view' | 'date_click' | 'booking_request';
      scheduleDate?: string;
    }) => {
      const { error } = await supabase.rpc('track_venue_interest', {
        _location_id: locationId,
        _event_type: eventType,
        _visitor_key: getVisitorKey(),
        _schedule_date: scheduleDate,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['venue-interest', variables.locationId] });
      queryClient.invalidateQueries({ queryKey: ['venue-interest', 'all'] });
    },
  });
}

export function useCreateBallroomSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: { 
      location_id: string; 
      schedule_date: string; 
      start_time?: string; 
      end_time?: string; 
      status?: string; 
      event_name?: string; 
      notes?: string;
      promo_type?: string | null;
      promo_label?: string | null;
      promo_expires_at?: string | null;
    }) => {
      const { error } = await supabase.from('ballroom_schedules').insert(schedule);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-schedules'] });
      toast.success('Schedule created');
    },
    onError: () => toast.error('Failed to create schedule'),
  });
}

export function useUpdateBallroomSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('ballroom_schedules').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-schedules'] });
      toast.success('Schedule updated');
    },
    onError: () => toast.error('Failed to update schedule'),
  });
}

export function useDeleteBallroomSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ballroom_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-schedules'] });
      toast.success('Schedule deleted');
    },
    onError: () => toast.error('Failed to delete schedule'),
  });
}

// Ballroom Bookings
export function useBallroomBookings(locationId?: string) {
  return useQuery({
    queryKey: ['ballroom-bookings', locationId],
    queryFn: async () => {
      let query = supabase
        .from('ballroom_bookings')
        .select('*, locations(name)')
        .order('created_at', { ascending: false });
      
      if (locationId) {
        query = query.eq('location_id', locationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBallroomBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (booking: { 
      location_id: string; 
      booking_date: string; 
      start_time?: string; 
      end_time?: string; 
      contact_name: string;
      contact_email: string;
      contact_phone: string;
      event_name: string;
      event_type?: string;
      guest_count?: number;
      notes?: string;
      session_id?: string;

    }) => {
      const { data, error } = await supabase.from('ballroom_bookings').insert(booking).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-bookings'] });
    },
    onError: () => toast.error('Gagal mengirim permintaan booking'),
  });
}

export function useUpdateBallroomBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('ballroom_bookings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['ballroom-schedules'] });
      toast.success('Booking updated');
    },
    onError: () => toast.error('Failed to update booking'),
  });
}

export function useDeleteBallroomBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ballroom_bookings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ballroom-bookings'] });
      toast.success('Booking deleted');
    },
    onError: () => toast.error('Failed to delete booking'),
  });
}

// Articles
export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (article: {
      title: string;
      slug: string;
      excerpt?: string | null;
      content?: string | null;
      featured_image?: string | null;
      author_name?: string | null;
      category?: string | null;
      tags?: string[] | null;
      meta_title?: string | null;
      meta_description?: string | null;
      meta_keywords?: string | null;
      reading_time?: number;
      is_published?: boolean;
      published_at?: string | null;
      sort_order?: number;
    }) => {
      const { error } = await supabase.from('articles').insert(article);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created');
    },
    onError: () => toast.error('Failed to create article'),
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('articles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article updated');
    },
    onError: () => toast.error('Failed to update article'),
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted');
    },
    onError: () => toast.error('Failed to delete article'),
  });
}

// About Settings
export function useAboutSettings() {
  return useQuery({
    queryKey: ['about-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateAboutSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('about_settings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-settings'] });
      toast.success('About settings updated');
    },
    onError: () => toast.error('Failed to update about settings'),
  });
}

// About Sections (Page Builder)
export function useAboutSections() {
  return useQuery({
    queryKey: ['about-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAboutSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: { section_type: string; title?: string; content?: unknown; styling?: unknown; sort_order?: number }) => {
      const { error } = await supabase.from('about_sections').insert([section as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-sections'] });
      toast.success('Section created');
    },
    onError: () => toast.error('Failed to create section'),
  });
}

export function useUpdateAboutSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from('about_sections').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-sections'] });
      toast.success('Section updated');
    },
    onError: () => toast.error('Failed to update section'),
  });
}

export function useDeleteAboutSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('about_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-sections'] });
      toast.success('Section deleted');
    },
    onError: () => toast.error('Failed to delete section'),
  });
}

export function useBulkUpdateAboutSectionOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sections: { id: string; sort_order: number }[]) => {
      for (const s of sections) {
        const { error } = await supabase.from('about_sections').update({ sort_order: s.sort_order }).eq('id', s.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-sections'] });
    },
    onError: () => toast.error('Failed to reorder sections'),
  });
}

// External Supabase — Deals (dipakai untuk menandai tanggal terbooking di kalender)
export interface ExternalDeal {
  id: number | string;
  namaVenue?: string | null;
  tanggalAcara?: string | null;
  waktuAcara?: string | null;
  jenisBooking?: string | null;
}

export function useExternalDeals() {
  return useQuery({
    queryKey: ['external-deals'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('external-deals');
      if (error) throw error;
      return (data?.deals ?? []) as ExternalDeal[];
    },
  });
}

/** Tanggal yang sudah dibooking berdasarkan data deals eksternal. */
export interface ExternalBookedSlot {
  /** true bila waktu acara tidak diketahui / mencakup seluruh hari */
  fullDay: boolean;
  /** rentang waktu terpakai dalam format HH:mm */
  ranges: { start: string; end: string }[];
}

/** Ambil rentang waktu dari teks bebas seperti "10:00 - 14:00" atau "10.00-14.00" */
function parseExternalTimeRange(raw?: string | null): { start: string; end: string } | null {
  if (!raw) return null;
  const matches = String(raw).match(/(\d{1,2})[:.](\d{2})/g);
  if (!matches || matches.length < 2) return null;
  const norm = (t: string) => {
    const [h, m] = t.split(/[:.]/);
    return `${h.padStart(2, '0')}:${m}`;
  };
  return { start: norm(matches[0]), end: norm(matches[1]) };
}

export function useExternalBookedDates(venueName?: string) {
  const { data: deals = [], isLoading } = useExternalDeals();

  const bookedDates = useMemo(() => {
    const normalize = (v?: string | null) => (v ?? '').toLowerCase().trim();
    const target = normalize(venueName);
    const matches = target
      ? deals.filter(d => {
          const v = normalize(d.namaVenue);
          if (!v) return false;
          if (v === target) return true;
          // Hindari false-positive dari nama venue yang terlalu pendek/generik
          if (v.length < 4 || target.length < 4) return false;
          return v.includes(target) || target.includes(v);
        })
      : [];
    // Tanpa nama venue, jangan blokir tanggal venue mana pun
    const source = target ? matches : [];

    const map = new Map<string, ExternalBookedSlot>();
    source.forEach(d => {
      const date = (d.tanggalAcara ?? '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      const slot = map.get(date) ?? { fullDay: false, ranges: [] };
      const range = parseExternalTimeRange(d.waktuAcara as string | null | undefined);
      if (range) slot.ranges.push(range);
      else slot.fullDay = true;
      map.set(date, slot);
    });
    return map;
  }, [deals, venueName]);

  return { bookedDates, isLoading };
}



