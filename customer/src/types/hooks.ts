export interface CurrencyHookResult {
    usdAmount: string;
    loading: boolean;
    error: string | null;
}

export interface TourData {
    'tour-title': string;
    'tour-price': number;
    [key: string]: any;
}

export interface TourDataHookResult {
    tourData: TourData | null;
    loading: boolean;
    error: Error | null;
}

export interface TimeSlot {
    time: string;
    availableSpots: number | null;
}

export interface HookAvailabilityData {
    dateKey: string;
    hasAvailability: boolean;
    timeSlots: TimeSlot[];
    timestamp: number;
    source?: string;
    fallback?: boolean;
}

export interface AvailabilityHookResult {
    preloadedAvailability: Record<string, HookAvailabilityData>;
    availabilityLoading: boolean;
    setAvailabilityLoading: (loading: boolean) => void;
    preloadAvailabilityForDates: (startDate: Date, endDate: Date) => Promise<void>;
    returnAvailableTimes: (date: Date, participants: number) => Promise<string[]>;
    isDateFull: (date: Date, participants: number) => boolean;
    findNextAvailableDate: () => Promise<Date>;
}

export interface Booking {
    id?: string;
    booking_date: string;
    booking_time: string;
    adults: number;
    children: number;
    tour_type: string;
    status: string;
    [key: string]: any;
}

export interface BookingsHookResult {
    bookings: Booking[];
    participantsByDate: Record<string, Record<string, number>>;
    fetchBookings: () => Promise<void>;
}