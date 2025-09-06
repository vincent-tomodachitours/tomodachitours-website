import { supabase } from '../lib/supabase';
import { TourType, TimeSlot } from '../types';

export interface Tour {
    id: string;
    type: TourType; // Changed from tour_type to type
    name: string;
    description: string;
    duration_minutes: number;
    base_price: number;
    time_slots: TimeSlot[];
    meeting_point: string;
    meeting_point_lat?: number;
    meeting_point_lng?: number;
    max_participants: number;
    min_participants: number;
    included_items: string[];
    excluded_items: string[];
    requirements: string[];
    cancellation_policy: string;
    images: string[];
    status: 'active' | 'inactive' | 'draft';
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
    created_at: string;
    updated_at: string;
}

export interface TourPricing {
    id: string;
    tour_id: string;
    season_name: string;
    start_date: string;
    end_date: string;
    adult_price: number;
    child_price: number;
    infant_price: number;
    group_discount_threshold?: number;
    group_discount_percentage?: number;
    early_bird_days?: number;
    early_bird_discount?: number;
    last_minute_hours?: number;
    last_minute_discount?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface TourSchedule {
    id: string;
    tour_id: string;
    day_of_week: number; // 0-6 (Sunday-Saturday)
    time_slot: string;
    is_available: boolean;
    seasonal_override?: {
        start_date: string;
        end_date: string;
        is_available: boolean;
    };
    max_participants_override?: number;
    created_at: string;
    updated_at: string;
}

export interface TourAvailability {
    id: string;
    tour_id: string;
    date: string;
    time_slot: string;
    available_spots: number;
    is_blackout: boolean;
    blackout_reason?: string;
    price_override?: {
        adult_price?: number;
        child_price?: number;
        infant_price?: number;
    };
    created_at: string;
    updated_at: string;
}

export interface TourFormData {
    type: TourType; // Changed from tour_type to type
    name: string;
    description: string;
    duration_minutes: number;
    price_jpy?: number; // This maps to base_price in the database
    time_slots: TimeSlot[];
    meeting_point: string;
    meeting_point_lat?: number;
    meeting_point_lng?: number;
    max_participants: number;
    min_participants: number;
    included_items: string[];
    excluded_items: string[];
    requirements: string[];
    cancellation_policy: string;
    images?: string[];
    status: 'active' | 'inactive' | 'draft';
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
}

export interface TourStats {
    totalTours: number;
    activeTours: number;
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    popularTours: {
        tour: Tour;
        bookings: number;
        revenue: number;
    }[];
}

export class TourService {
    /**
     * Get all tours with optional filters
     */
    static async getTours(filters?: {
        status?: ('active' | 'inactive' | 'draft')[];
        tourType?: TourType[];
        searchQuery?: string;
    }): Promise<Tour[]> {
        try {
            let query = supabase
                .from('tours')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters) {
                if (filters.status && filters.status.length > 0) {
                    query = query.in('status', filters.status);
                }

                if (filters.tourType && filters.tourType.length > 0) {
                    query = query.in('type', filters.tourType);
                }



                if (filters.searchQuery) {
                    query = query.or(`name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching tours:', error);
                // If it's a table not found error, return empty array
                if (error.message.includes('relation "tours" does not exist') ||
                    error.message.includes('does not exist') ||
                    error.code === 'PGRST106') {
                    console.warn('Tours table does not exist yet. Please run the database setup script.');
                    return [];
                }
                throw error;
            }



            return data || [];
        } catch (error) {
            console.error('TourService.getTours error:', error);
            // Return empty array instead of throwing to prevent app crash
            return [];
        }
    }

    /**
     * Get tour by ID
     */
    static async getTourById(id: string): Promise<Tour | null> {
        try {
            console.log('🔍 Fetching tour by ID:', id);

            const { data, error } = await supabase
                .from('tours')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('❌ Tour not found:', id);
                    return null;
                }
                console.error('❌ Error fetching tour:', error);
                throw error;
            }

            console.log('✅ Tour fetched successfully:', data);
            console.log('🕐 Tour duration_minutes from DB:', data?.duration_minutes);

            return data;
        } catch (error) {
            console.error('❌ TourService.getTourById error:', error);
            throw error;
        }
    }

    /**
     * Create a new tour
     */
    static async createTour(tourData: TourFormData): Promise<Tour> {
        try {
            // Map price_jpy to base_price for database
            const dbData = { ...tourData };
            if (tourData.price_jpy !== undefined) {
                (dbData as any).base_price = tourData.price_jpy;
                delete dbData.price_jpy;
            }

            const { data, error } = await supabase
                .from('tours')
                .insert({
                    ...dbData,
                    id: crypto.randomUUID(),
                    images: tourData.images || [],
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating tour:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TourService.createTour error:', error);
            throw error;
        }
    }

    /**
     * Update tour
     */
    static async updateTour(id: string, updates: Partial<TourFormData>): Promise<Tour> {
        try {
            console.log('🔄 TourService.updateTour called with:', { id, updates });
            console.log('🕐 Duration minutes being sent:', updates.duration_minutes);
            console.log('💰 Price being sent:', updates.price_jpy);

            // Map price_jpy to base_price for database
            const dbUpdates = { ...updates };
            if (updates.price_jpy !== undefined) {
                (dbUpdates as any).base_price = updates.price_jpy;
                delete dbUpdates.price_jpy;
            }

            const { data, error } = await supabase
                .from('tours')
                .update({
                    ...dbUpdates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Database update error:', error);
                throw error;
            }

            console.log('✅ Database update successful:', data);
            console.log('🕐 Updated duration_minutes in DB:', data.duration_minutes);
            console.log('💰 Updated base_price in DB:', data.base_price);

            return data;
        } catch (error) {
            console.error('❌ TourService.updateTour error:', error);
            throw error;
        }
    }

    /**
     * Delete tour
     */
    static async deleteTour(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('tours')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting tour:', error);
                throw error;
            }
        } catch (error) {
            console.error('TourService.deleteTour error:', error);
            throw error;
        }
    }

    /**
     * Get tour pricing for a tour
     */
    static async getTourPricing(tourId: string): Promise<TourPricing[]> {
        try {
            const { data, error } = await supabase
                .from('tour_pricing')
                .select('*')
                .eq('tour_id', tourId)
                .eq('is_active', true)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching tour pricing:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TourService.getTourPricing error:', error);
            throw error;
        }
    }

    /**
     * Create or update tour pricing
     */
    static async saveTourPricing(pricing: Omit<TourPricing, 'created_at' | 'updated_at'> & { id?: string }): Promise<TourPricing> {
        try {
            const { data, error } = await supabase
                .from('tour_pricing')
                .upsert({
                    ...pricing,
                    id: pricing.id || crypto.randomUUID()
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving tour pricing:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TourService.saveTourPricing error:', error);
            throw error;
        }
    }

    /**
     * Get tour schedule
     */
    static async getTourSchedule(tourId: string): Promise<TourSchedule[]> {
        try {
            const { data, error } = await supabase
                .from('tour_schedule')
                .select('*')
                .eq('tour_id', tourId)
                .order('day_of_week', { ascending: true })
                .order('time_slot', { ascending: true });

            if (error) {
                console.error('Error fetching tour schedule:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TourService.getTourSchedule error:', error);
            throw error;
        }
    }

    /**
     * Save tour schedule
     */
    static async saveTourSchedule(schedule: Omit<TourSchedule, 'created_at' | 'updated_at'> & { id?: string }): Promise<TourSchedule> {
        try {
            const { data, error } = await supabase
                .from('tour_schedule')
                .upsert({
                    ...schedule,
                    id: schedule.id || crypto.randomUUID()
                })
                .select()
                .single();

            if (error) {
                console.error('Error saving tour schedule:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TourService.saveTourSchedule error:', error);
            throw error;
        }
    }

    /**
     * Get tour availability for date range
     */
    static async getTourAvailability(
        tourId: string,
        startDate: string,
        endDate: string
    ): Promise<TourAvailability[]> {
        try {
            const { data, error } = await supabase
                .from('tour_availability')
                .select('*')
                .eq('tour_id', tourId)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true })
                .order('time_slot', { ascending: true });

            if (error) {
                console.error('Error fetching tour availability:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('TourService.getTourAvailability error:', error);
            throw error;
        }
    }

    /**
     * Update tour availability
     */
    static async updateTourAvailability(
        availability: Omit<TourAvailability, 'created_at' | 'updated_at'> & { id?: string }
    ): Promise<TourAvailability> {
        try {
            const { data, error } = await supabase
                .from('tour_availability')
                .upsert({
                    ...availability,
                    id: availability.id || crypto.randomUUID()
                })
                .select()
                .single();

            if (error) {
                console.error('Error updating tour availability:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TourService.updateTourAvailability error:', error);
            throw error;
        }
    }

    /**
     * Get current pricing for a tour on a specific date
     */
    static async getCurrentPricing(tourId: string, date: string): Promise<TourPricing | null> {
        try {
            const { data, error } = await supabase
                .from('tour_pricing')
                .select('*')
                .eq('tour_id', tourId)
                .eq('is_active', true)
                .lte('start_date', date)
                .gte('end_date', date)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching current pricing:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('TourService.getCurrentPricing error:', error);
            throw error;
        }
    }

    /**
     * Check if tour is available for booking
     */
    static async checkAvailability(
        tourId: string,
        date: string,
        timeSlot: string,
        participants: number
    ): Promise<{
        available: boolean;
        availableSpots: number;
        pricing?: TourPricing;
        message?: string;
    }> {
        try {
            // Check tour exists and is active
            const tour = await this.getTourById(tourId);
            if (!tour || tour.status !== 'active') {
                return {
                    available: false,
                    availableSpots: 0,
                    message: 'Tour is not available'
                };
            }

            // Calculate available spots
            const maxSpots = tour.max_participants;

            // Check existing bookings
            const { data: bookings, error: bookingError } = await supabase
                .from('bookings')
                .select('total_participants')
                .eq('tour_type', tour.type) // tour.type maps to database tour_type field in bookings
                .eq('booking_date', date)
                .eq('booking_time', timeSlot)
                .in('status', ['CONFIRMED', 'PENDING']);

            if (bookingError) {
                throw bookingError;
            }

            const bookedSpots = bookings?.reduce((sum, booking) => sum + booking.total_participants, 0) || 0;
            const availableSpots = maxSpots - bookedSpots;

            return {
                available: availableSpots >= participants && participants >= tour.min_participants,
                availableSpots,
                message: availableSpots < participants
                    ? `Only ${availableSpots} spots available`
                    : participants < tour.min_participants
                        ? `Minimum ${tour.min_participants} participants required`
                        : undefined
            };
        } catch (error) {
            console.error('TourService.checkAvailability error:', error);
            throw error;
        }
    }

    /**
     * Get tour statistics
     */
    static async getTourStats(): Promise<TourStats> {
        try {
            const [toursResult, bookingsResult] = await Promise.all([
                supabase.from('tours').select('id, status, type'),
                supabase
                    .from('bookings')
                    .select('tour_type, total_participants, status')
                    .eq('status', 'CONFIRMED')
            ]);

            // Handle case where tours table doesn't exist
            if (toursResult.error) {
                console.warn('Tours table may not exist yet:', toursResult.error);
                return {
                    totalTours: 0,
                    activeTours: 0,
                    totalBookings: 0,
                    totalRevenue: 0,
                    averageRating: 0,
                    popularTours: []
                };
            }

            const tours = toursResult.data || [];
            const bookings = bookingsResult.data || [];

            // Calculate basic stats
            const totalTours = tours.length;
            const activeTours = tours.filter(t => t.status === 'active').length;

            const totalBookings = bookings.length;

            // Calculate revenue (simplified - you may need to adjust based on your pricing)
            const averagePrice = 50; // USD per participant
            const totalRevenue = bookings.reduce((sum, booking) =>
                sum + (booking.total_participants * averagePrice), 0);

            // Calculate popular tours
            const tourBookings = bookings.reduce((acc, booking) => {
                acc[booking.tour_type] = (acc[booking.tour_type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const tourRevenue = bookings.reduce((acc, booking) => {
                if (!acc[booking.tour_type]) acc[booking.tour_type] = 0;
                acc[booking.tour_type] += booking.total_participants * averagePrice;
                return acc;
            }, {} as Record<string, number>);

            const popularTours = await Promise.all(
                Object.entries(tourBookings)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(async ([tourType, bookingCount]) => {
                        const tour = await this.getTours({ tourType: [tourType as TourType] });
                        return {
                            tour: tour[0],
                            bookings: bookingCount,
                            revenue: tourRevenue[tourType] || 0
                        };
                    })
            );

            return {
                totalTours,
                activeTours,
                totalBookings,
                totalRevenue,
                averageRating: 4.7, // Simplified - you'd calculate from reviews
                popularTours: popularTours.filter(p => p.tour)
            };
        } catch (error) {
            console.error('TourService.getTourStats error:', error);
            // Return default stats to prevent app crash
            return {
                totalTours: 0,
                activeTours: 0,
                totalBookings: 0,
                totalRevenue: 0,
                averageRating: 0,
                popularTours: []
            };
        }
    }

    /**
     * Duplicate tour (for creating variants)
     */
    static async duplicateTour(tourId: string, newName: string): Promise<Tour> {
        try {
            const originalTour = await this.getTourById(tourId);
            if (!originalTour) {
                throw new Error('Tour not found');
            }

            const { id, created_at, updated_at, ...tourData } = originalTour;

            const duplicatedTour = await this.createTour({
                ...tourData,
                name: newName,
                status: 'draft' // Start as draft
            });

            return duplicatedTour;
        } catch (error) {
            console.error('TourService.duplicateTour error:', error);
            throw error;
        }
    }

    /**
     * Bulk update tour status
     */
    static async bulkUpdateStatus(tourIds: string[], status: 'active' | 'inactive' | 'draft'): Promise<void> {
        try {
            const { error } = await supabase
                .from('tours')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .in('id', tourIds);

            if (error) {
                console.error('Error bulk updating tour status:', error);
                throw error;
            }
        } catch (error) {
            console.error('TourService.bulkUpdateStatus error:', error);
            throw error;
        }
    }
}