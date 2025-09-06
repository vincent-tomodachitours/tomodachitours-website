import { supabase } from '../lib/supabase';
import { TourType, BookingStatus, EmployeeRole, ShiftStatus } from '../types';

export interface AnalyticsData {
    // Overview metrics
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    totalEmployees: number;

    // Booking metrics
    bookingsByStatus: { status: BookingStatus; count: number; percentage: number }[];
    bookingsByTourType: { tourType: TourType; count: number; revenue: number; percentage: number }[];
    recentBookings: any[];

    // Revenue metrics
    revenueByMonth: { month: string; revenue: number; bookings: number }[];
    revenueByTourType: { tourType: TourType; revenue: number; bookings: number }[];
    averageBookingValue: number;

    // Employee metrics
    employeesByRole: { role: EmployeeRole; count: number; percentage: number }[];
    employeesByStatus: { status: string; count: number; percentage: number }[];
    topPerformingGuides: { guide: any; bookings: number; revenue: number }[];

    // Shift metrics
    shiftsByStatus: { status: ShiftStatus; count: number; percentage: number }[];
    shiftUtilization: { date: string; totalShifts: number; assignedShifts: number; utilization: number }[];

    // Trends
    bookingTrends: { date: string; bookings: number; revenue: number }[];
    customerTrends: { date: string; newCustomers: number; returningCustomers: number }[];

    // Performance indicators
    conversionRate: number;
    averageBookingLeadTime: number;
    peakBookingHours: { hour: number; count: number }[];
    seasonalTrends: { month: string; bookings: number; revenue: number }[];
}

export class AnalyticsService {
    /**
     * Get comprehensive analytics overview
     */
    static async getAnalyticsOverview(dateRange?: { start: Date; end: Date }): Promise<AnalyticsData> {
        try {
            const [
                overviewMetrics,
                bookingMetrics,
                revenueMetrics,
                employeeMetrics,
                shiftMetrics,
                trendMetrics
            ] = await Promise.all([
                this.getOverviewMetrics(dateRange),
                this.getBookingMetrics(dateRange),
                this.getRevenueMetrics(dateRange),
                this.getEmployeeMetrics(),
                this.getShiftMetrics(dateRange),
                this.getTrendMetrics(dateRange)
            ]);

            return {
                ...overviewMetrics,
                ...bookingMetrics,
                ...revenueMetrics,
                ...employeeMetrics,
                ...shiftMetrics,
                ...trendMetrics
            };
        } catch (error) {
            console.error('AnalyticsService.getAnalyticsOverview error:', error);
            throw error;
        }
    }

    /**
     * Get overview metrics
     */
    private static async getOverviewMetrics(dateRange?: { start: Date; end: Date }) {
        try {
            let bookingsQuery = supabase
                .from('bookings')
                .select('id, total_participants, created_at, customer_email');

            if (dateRange) {
                bookingsQuery = bookingsQuery
                    .gte('created_at', dateRange.start.toISOString())
                    .lte('created_at', dateRange.end.toISOString());
            }

            const [bookingsResult, employeesResult] = await Promise.all([
                bookingsQuery,
                supabase.from('employees').select('id, status').eq('status', 'active')
            ]);

            const bookings = bookingsResult.data || [];
            const employees = employeesResult.data || [];

            // Calculate revenue (this is a simplified calculation - you may need to adjust based on your pricing)
            const totalRevenue = bookings.reduce((sum, booking) => {
                // Assuming average price per participant - you'll need to adjust this
                const averagePrice = 50; // USD per participant
                return sum + (booking.total_participants * averagePrice);
            }, 0);

            const uniqueCustomers = new Set(bookings.map(b => b.customer_email)).size;

            return {
                totalBookings: bookings.length,
                totalRevenue,
                totalCustomers: uniqueCustomers,
                totalEmployees: employees.length
            };
        } catch (error) {
            console.error('Error fetching overview metrics:', error);
            throw error;
        }
    }

    /**
     * Get booking analytics
     */
    private static async getBookingMetrics(dateRange?: { start: Date; end: Date }) {
        try {
            let query = supabase
                .from('bookings')
                .select('id, status, tour_type, total_participants, created_at, customer_email');

            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start.toISOString())
                    .lte('created_at', dateRange.end.toISOString());
            }

            const { data: bookings, error } = await query;

            if (error) throw error;

            const totalBookings = bookings.length;

            // Bookings by status
            const statusCounts = bookings.reduce((acc, booking) => {
                acc[booking.status] = (acc[booking.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
                status: status as BookingStatus,
                count,
                percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0
            }));

            // Bookings by tour type
            const tourTypeCounts = bookings.reduce((acc, booking) => {
                const tourType = booking.tour_type;
                if (!acc[tourType]) {
                    acc[tourType] = { count: 0, revenue: 0 };
                }
                acc[tourType].count++;
                acc[tourType].revenue += booking.total_participants * 50; // Simplified pricing
                return acc;
            }, {} as Record<string, { count: number; revenue: number }>);

            const bookingsByTourType = Object.entries(tourTypeCounts).map(([tourType, data]) => ({
                tourType: tourType as TourType,
                count: data.count,
                revenue: data.revenue,
                percentage: totalBookings > 0 ? (data.count / totalBookings) * 100 : 0
            }));

            // Recent bookings
            const recentBookings = bookings
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

            return {
                bookingsByStatus,
                bookingsByTourType,
                recentBookings
            };
        } catch (error) {
            console.error('Error fetching booking metrics:', error);
            throw error;
        }
    }

    /**
     * Get revenue analytics
     */
    private static async getRevenueMetrics(dateRange?: { start: Date; end: Date }) {
        try {
            let query = supabase
                .from('bookings')
                .select('id, tour_type, total_participants, created_at, booking_date')
                .eq('status', 'CONFIRMED');

            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start.toISOString())
                    .lte('created_at', dateRange.end.toISOString());
            }

            const { data: bookings, error } = await query;

            if (error) throw error;

            const averagePrice = 50; // Simplified pricing

            // Revenue by month
            const monthlyRevenue = bookings.reduce((acc, booking) => {
                const month = new Date(booking.created_at).toISOString().substring(0, 7);
                if (!acc[month]) {
                    acc[month] = { revenue: 0, bookings: 0 };
                }
                acc[month].revenue += booking.total_participants * averagePrice;
                acc[month].bookings++;
                return acc;
            }, {} as Record<string, { revenue: number; bookings: number }>);

            const revenueByMonth = Object.entries(monthlyRevenue).map(([month, data]) => ({
                month,
                revenue: data.revenue,
                bookings: data.bookings
            }));

            // Revenue by tour type
            const tourTypeRevenue = bookings.reduce((acc, booking) => {
                const tourType = booking.tour_type;
                if (!acc[tourType]) {
                    acc[tourType] = { revenue: 0, bookings: 0 };
                }
                acc[tourType].revenue += booking.total_participants * averagePrice;
                acc[tourType].bookings++;
                return acc;
            }, {} as Record<string, { revenue: number; bookings: number }>);

            const revenueByTourType = Object.entries(tourTypeRevenue).map(([tourType, data]) => ({
                tourType: tourType as TourType,
                revenue: data.revenue,
                bookings: data.bookings
            }));

            // Average booking value
            const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_participants * averagePrice), 0);
            const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

            return {
                revenueByMonth,
                revenueByTourType,
                averageBookingValue
            };
        } catch (error) {
            console.error('Error fetching revenue metrics:', error);
            throw error;
        }
    }

    /**
     * Get employee analytics
     */
    private static async getEmployeeMetrics() {
        try {
            const [employeesResult, bookingsResult] = await Promise.all([
                supabase.from('employees').select('id, role, status, first_name, last_name, employee_code'),
                supabase.from('bookings').select('id, assigned_guide_id, total_participants, status').eq('status', 'CONFIRMED')
            ]);

            const employees = employeesResult.data || [];
            const bookings = bookingsResult.data || [];

            const totalEmployees = employees.length;

            // Employees by role
            const roleCounts = employees.reduce((acc, employee) => {
                acc[employee.role] = (acc[employee.role] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const employeesByRole = Object.entries(roleCounts).map(([role, count]) => ({
                role: role as EmployeeRole,
                count,
                percentage: totalEmployees > 0 ? (count / totalEmployees) * 100 : 0
            }));

            // Employees by status
            const statusCounts = employees.reduce((acc, employee) => {
                acc[employee.status] = (acc[employee.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const employeesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
                status,
                count,
                percentage: totalEmployees > 0 ? (count / totalEmployees) * 100 : 0
            }));

            // Top performing guides
            const guidePerformance = bookings.reduce((acc, booking) => {
                if (booking.assigned_guide_id) {
                    if (!acc[booking.assigned_guide_id]) {
                        acc[booking.assigned_guide_id] = { bookings: 0, revenue: 0 };
                    }
                    acc[booking.assigned_guide_id].bookings++;
                    acc[booking.assigned_guide_id].revenue += booking.total_participants * 50;
                }
                return acc;
            }, {} as Record<string, { bookings: number; revenue: number }>);

            const topPerformingGuides = Object.entries(guidePerformance)
                .map(([guideId, performance]) => {
                    const guide = employees.find(e => e.id === guideId);
                    return {
                        guide: guide || { id: guideId, first_name: 'Unknown', last_name: 'Guide' },
                        bookings: performance.bookings,
                        revenue: performance.revenue
                    };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            return {
                employeesByRole,
                employeesByStatus,
                topPerformingGuides
            };
        } catch (error) {
            console.error('Error fetching employee metrics:', error);
            throw error;
        }
    }

    /**
     * Get shift analytics
     */
    private static async getShiftMetrics(dateRange?: { start: Date; end: Date }) {
        try {
            let query = supabase
                .from('employee_shifts')
                .select('id, status, shift_date, tour_type, employee_id');

            if (dateRange) {
                query = query
                    .gte('shift_date', dateRange.start.toISOString().split('T')[0])
                    .lte('shift_date', dateRange.end.toISOString().split('T')[0]);
            }

            const { data: shifts, error } = await query;

            if (error) throw error;

            const totalShifts = shifts.length;

            // Shifts by status
            const statusCounts = shifts.reduce((acc, shift) => {
                acc[shift.status] = (acc[shift.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const shiftsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
                status: status as ShiftStatus,
                count,
                percentage: totalShifts > 0 ? (count / totalShifts) * 100 : 0
            }));

            // Shift utilization by date
            const utilizationByDate = shifts.reduce((acc, shift) => {
                const date = shift.shift_date;
                if (!acc[date]) {
                    acc[date] = { total: 0, assigned: 0 };
                }
                acc[date].total++;
                if (shift.status === 'assigned') {
                    acc[date].assigned++;
                }
                return acc;
            }, {} as Record<string, { total: number; assigned: number }>);

            const shiftUtilization = Object.entries(utilizationByDate).map(([date, data]) => ({
                date,
                totalShifts: data.total,
                assignedShifts: data.assigned,
                utilization: data.total > 0 ? (data.assigned / data.total) * 100 : 0
            }));

            return {
                shiftsByStatus,
                shiftUtilization
            };
        } catch (error) {
            console.error('Error fetching shift metrics:', error);
            throw error;
        }
    }

    /**
     * Get trend analytics
     */
    private static async getTrendMetrics(dateRange?: { start: Date; end: Date }) {
        try {
            let query = supabase
                .from('bookings')
                .select('id, created_at, booking_date, total_participants, customer_email, status');

            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start.toISOString())
                    .lte('created_at', dateRange.end.toISOString());
            }

            const { data: bookings, error } = await query;

            if (error) throw error;

            const averagePrice = 50;

            // Booking trends
            const trendsByDate = bookings.reduce((acc, booking) => {
                const date = booking.created_at.split('T')[0];
                if (!acc[date]) {
                    acc[date] = { bookings: 0, revenue: 0 };
                }
                acc[date].bookings++;
                acc[date].revenue += booking.total_participants * averagePrice;
                return acc;
            }, {} as Record<string, { bookings: number; revenue: number }>);

            const bookingTrends = Object.entries(trendsByDate).map(([date, data]) => ({
                date,
                bookings: data.bookings,
                revenue: data.revenue
            }));

            // Customer trends (simplified)
            const customerTrends = bookingTrends.map(trend => ({
                date: trend.date,
                newCustomers: Math.floor(trend.bookings * 0.8), // Simplified assumption
                returningCustomers: Math.floor(trend.bookings * 0.2)
            }));

            // Performance indicators
            const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
            const conversionRate = bookings.length > 0 ? (confirmedBookings / bookings.length) * 100 : 0;

            // Average booking lead time
            const leadTimes = bookings
                .filter(b => b.booking_date && b.created_at)
                .map(b => {
                    const bookingDate = new Date(b.booking_date);
                    const createdDate = new Date(b.created_at);
                    return Math.floor((bookingDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                })
                .filter(days => days >= 0);

            const averageBookingLeadTime = leadTimes.length > 0
                ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length
                : 0;

            // Peak booking hours (simplified)
            const peakBookingHours = Array.from({ length: 24 }, (_, hour) => ({
                hour,
                count: Math.floor(Math.random() * 10) // Simplified - you'd calculate this from actual data
            }));

            // Seasonal trends
            const seasonalTrends = bookingTrends.reduce((acc, trend) => {
                const month = trend.date.substring(0, 7);
                if (!acc[month]) {
                    acc[month] = { bookings: 0, revenue: 0 };
                }
                acc[month].bookings += trend.bookings;
                acc[month].revenue += trend.revenue;
                return acc;
            }, {} as Record<string, { bookings: number; revenue: number }>);

            const seasonalTrendsArray = Object.entries(seasonalTrends).map(([month, data]) => ({
                month,
                bookings: data.bookings,
                revenue: data.revenue
            }));

            return {
                bookingTrends,
                customerTrends,
                conversionRate,
                averageBookingLeadTime,
                peakBookingHours,
                seasonalTrends: seasonalTrendsArray
            };
        } catch (error) {
            console.error('Error fetching trend metrics:', error);
            throw error;
        }
    }

    /**
     * Export analytics data
     */
    static async exportAnalyticsData(format: 'json' | 'csv' = 'json', dateRange?: { start: Date; end: Date }) {
        try {
            const data = await this.getAnalyticsOverview(dateRange);

            if (format === 'csv') {
                // Convert to CSV format
                const csvData = this.convertToCSV(data);
                return csvData;
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting analytics data:', error);
            throw error;
        }
    }

    /**
     * Convert analytics data to CSV format
     */
    private static convertToCSV(data: any): string {
        const csvRows: string[] = [];

        // Add header
        csvRows.push('Metric,Value');

        // Add basic metrics
        csvRows.push(`Total Bookings,${data.totalBookings}`);
        csvRows.push(`Total Revenue,${data.totalRevenue}`);
        csvRows.push(`Total Customers,${data.totalCustomers}`);
        csvRows.push(`Total Employees,${data.totalEmployees}`);
        csvRows.push(`Average Booking Value,${data.averageBookingValue}`);
        csvRows.push(`Conversion Rate,${data.conversionRate}%`);
        csvRows.push(`Average Lead Time,${data.averageBookingLeadTime} days`);

        return csvRows.join('\n');
    }
} 