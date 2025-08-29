// Database types
export type EmployeeRole = 'admin' | 'manager' | 'tour_guide' | 'support';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended' | 'terminated';
export type ShiftStatus = 'available' | 'assigned' | 'unavailable' | 'completed' | 'cancelled';
export type TourType = 'NIGHT_TOUR' | 'MORNING_TOUR' | 'UJI_TOUR' | 'UJI_WALKING_TOUR' | 'GION_TOUR';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

// Employee interface
export interface Employee {
    id: string;
    user_id: string;
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    status: EmployeeStatus;
    hire_date: string;
    emergency_contact?: any;
    certifications?: string[];
    tour_types: TourType[];
    created_at: string;
    updated_at: string;
}

// Employee shift interface
export interface EmployeeShift {
    id: string;
    employee_id: string;
    tour_type: TourType;
    shift_date: string;
    time_slot: string;
    status: ShiftStatus;
    max_participants?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    employee: {
        id: string;
        first_name: string;
        last_name: string;
        employee_code: string;
        email: string;
        phone?: string;
        role: EmployeeRole;
        status: EmployeeStatus;
        tour_types: TourType[];
    };
}

// Booking interface (extended from existing)
export interface Booking {
    id: number;
    adults: number;
    booking_date: string;
    booking_time: string;
    charge_id?: string;
    children: number;
    created_at: string;
    customer_email: string;
    customer_name: string;
    customer_phone?: string;
    discount_amount?: number;
    discount_code?: string;
    discount_code_id?: number;
    infants: number;
    status: string;
    total_participants?: number;
    tour_type: string;
    assigned_guide_id?: string;
    guide_notes?: string;
    assigned_guide?: Employee;
    external_source?: string;
    bokun_booking_id?: string;
    bokun_synced?: boolean;
}

// Admin activity log interface
export interface AdminActivityLog {
    id: string;
    admin_id: string;
    action_type: string;
    entity_type: string;
    entity_id: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    admin?: Employee;
}

// Permission types
export type Permission =
    | 'view_bookings'
    | 'edit_bookings'
    | 'manage_tours'
    | 'manage_employees'
    | 'view_analytics'
    | 'manage_own_availability'
    | 'system_admin';

// Auth context types
export interface AdminAuthContextType {
    employee: Employee | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (permission: Permission) => boolean;
    hasRole: (role: EmployeeRole) => boolean;
}

// Filter types for various lists
export interface BookingFilters {
    dateRange?: { start: Date; end: Date };
    tourType?: TourType[];
    status?: BookingStatus[];
    assignedGuide?: string[];
    searchQuery?: string;
}

export interface EmployeeFilters {
    role?: EmployeeRole[];
    status?: EmployeeStatus[];
    searchQuery?: string;
}

export interface ShiftFilters {
    dateRange?: { start: Date; end: Date };
    tourType?: TourType[];
    status?: ShiftStatus[];
    employeeId?: string;
}

// API response types
export interface ApiResponse<T> {
    data: T;
    error?: string;
    success: boolean;
}

// Form types
export interface EmployeeFormData {
    employee_code: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: EmployeeRole;
    hire_date: string;
    emergency_contact?: any;
    certifications?: string[];
    tour_types: TourType[];
}

export interface ShiftFormData {
    employee_id: string;
    tour_type: TourType;
    shift_date: string;
    time_slot: string;
    max_participants?: number;
    notes?: string;
}

// Meeting point interface
export interface MeetingPoint {
    location: string;
    google_maps_url?: string;
    additional_info?: string;
}

// Tour Management types
export interface TimeSlot {
    start_time: string;
    end_time: string;
    is_active: boolean;
    max_capacity: number;
}

export interface Tour {
    id: string;
    type: TourType;
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

export interface TourFilters {
    status?: ('active' | 'inactive' | 'draft')[];
    tourType?: TourType[];
    searchQuery?: string;
} 