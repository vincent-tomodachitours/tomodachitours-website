import { supabase } from '../lib/supabase';

export interface BookingRequestMetrics {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    conversionRate: number;
    averageProcessingTime: number; // in hours
    paymentFailureRate: number;
    requestsExceedingTimeLimit: number;
}

export interface ConversionMetrics {
    period: string;
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    conversionRate: number;
}

export interface PaymentFailureMetrics {
    totalPaymentAttempts: number;
    failedPayments: number;
    failureRate: number;
    commonFailureReasons: Array<{
        reason: string;
        count: number;
        percentage: number;
    }>;
}

export interface RejectionAnalysis {
    totalRejections: number;
    commonReasons: Array<{
        reason: string;
        count: number;
        percentage: number;
    }>;
}

export interface TimeAnalysis {
    averageProcessingTime: number; // in hours
    requestsExceedingTimeLimit: Array<{
        id: number;
        customer_name: string;
        customer_email: string;
        tour_type: string;
        booking_date: string;
        request_submitted_at: string;
        hoursOverdue: number;
    }>;
}

export interface DashboardMetrics {
    overview: BookingRequestMetrics;
    conversionTrends: ConversionMetrics[];
    paymentFailures: PaymentFailureMetrics;
    rejectionAnalysis: RejectionAnalysis;
    timeAnalysis: TimeAnalysis;
}

export class BookingRequestAnalyticsService {
    /**
     * Get comprehensive dashboard metrics
     */
    static async getDashboardMetrics(dateRange?: { start: Date; end: Date }): Promise<DashboardMetrics> {
        try {
            const [
                overview,
                conversionTrends,
                paymentFailures,
                rejectionAnalysis,
                timeAnalysis
            ] = await Promise.all([
                this.getOverviewMetrics(dateRange),
                this.getConversionTrends(dateRange),
                this.getPaymentFailureMetrics(dateRange),
                this.getRejectionAnalysis(dateRange),
                this.getTimeAnalysis()
            ]);

            return {
                overview,
                conversionTrends,
                paymentFailures,
                rejectionAnalysis,
                timeAnalysis
            };
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getDashboardMetrics error:', error);
            throw error;
        }
    }

    /**
     * Get overview metrics
     */
    static async getOverviewMetrics(dateRange?: { start: Date; end: Date }): Promise<BookingRequestMetrics> {
        try {
            let query = supabase
                .from('bookings')
                .select('status, request_submitted_at, admin_reviewed_at')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (dateRange) {
                query = query
                    .gte('request_submitted_at', dateRange.start.toISOString())
                    .lte('request_submitted_at', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching overview metrics:', error);
                throw error;
            }

            const requests = data || [];
            const totalRequests = requests.length;
            const pendingRequests = requests.filter(r => r.status === 'PENDING_CONFIRMATION').length;
            const approvedRequests = requests.filter(r => r.status === 'CONFIRMED').length;
            const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
            
            const conversionRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

            // Calculate average processing time for completed requests
            const completedRequests = requests.filter(r => 
                r.status !== 'PENDING_CONFIRMATION' && 
                r.request_submitted_at && 
                r.admin_reviewed_at
            );

            let averageProcessingTime = 0;
            if (completedRequests.length > 0) {
                const totalProcessingTime = completedRequests.reduce((sum, request) => {
                    const submitted = new Date(request.request_submitted_at!);
                    const reviewed = new Date(request.admin_reviewed_at!);
                    return sum + (reviewed.getTime() - submitted.getTime());
                }, 0);
                averageProcessingTime = totalProcessingTime / completedRequests.length / (1000 * 60 * 60); // Convert to hours
            }

            // Get payment failure rate (this would need to be tracked in booking_request_events)
            const paymentFailureRate = await this.getPaymentFailureRate(dateRange);

            // Get requests exceeding time limit (24 hours)
            const now = new Date();
            const timeLimitHours = 24;
            const requestsExceedingTimeLimit = requests.filter(r => {
                if (r.status !== 'PENDING_CONFIRMATION' || !r.request_submitted_at) return false;
                const submitted = new Date(r.request_submitted_at);
                const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
                return hoursElapsed > timeLimitHours;
            }).length;

            return {
                totalRequests,
                pendingRequests,
                approvedRequests,
                rejectedRequests,
                conversionRate,
                averageProcessingTime,
                paymentFailureRate,
                requestsExceedingTimeLimit
            };
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getOverviewMetrics error:', error);
            throw error;
        }
    }

    /**
     * Get conversion trends over time
     */
    static async getConversionTrends(dateRange?: { start: Date; end: Date }): Promise<ConversionMetrics[]> {
        try {
            const endDate = dateRange?.end || new Date();
            const startDate = dateRange?.start || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

            let query = supabase
                .from('bookings')
                .select('status, request_submitted_at')
                .in('tour_type', ['uji-tour', 'uji-walking-tour'])
                .gte('request_submitted_at', startDate.toISOString())
                .lte('request_submitted_at', endDate.toISOString());

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching conversion trends:', error);
                throw error;
            }

            const requests = data || [];

            // Group by week
            const weeklyMetrics: { [key: string]: ConversionMetrics } = {};

            requests.forEach(request => {
                if (!request.request_submitted_at) return;

                const date = new Date(request.request_submitted_at);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!weeklyMetrics[weekKey]) {
                    weeklyMetrics[weekKey] = {
                        period: weekKey,
                        totalRequests: 0,
                        approvedRequests: 0,
                        rejectedRequests: 0,
                        conversionRate: 0
                    };
                }

                weeklyMetrics[weekKey].totalRequests++;
                if (request.status === 'CONFIRMED') {
                    weeklyMetrics[weekKey].approvedRequests++;
                } else if (request.status === 'REJECTED') {
                    weeklyMetrics[weekKey].rejectedRequests++;
                }
            });

            // Calculate conversion rates
            Object.values(weeklyMetrics).forEach(metric => {
                metric.conversionRate = metric.totalRequests > 0 
                    ? (metric.approvedRequests / metric.totalRequests) * 100 
                    : 0;
            });

            return Object.values(weeklyMetrics).sort((a, b) => a.period.localeCompare(b.period));
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getConversionTrends error:', error);
            throw error;
        }
    }

    /**
     * Get payment failure metrics
     */
    static async getPaymentFailureMetrics(dateRange?: { start: Date; end: Date }): Promise<PaymentFailureMetrics> {
        try {
            // This would ideally query booking_request_events table for payment failure events
            // For now, we'll simulate this data structure
            let query = supabase
                .from('booking_request_events')
                .select('event_type, event_data, created_at')
                .in('event_type', ['payment_failed', 'approved']);

            if (dateRange) {
                query = query
                    .gte('created_at', dateRange.start.toISOString())
                    .lte('created_at', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                // If the events table doesn't exist yet, return default values
                console.warn('booking_request_events table not found, returning default payment metrics');
                return {
                    totalPaymentAttempts: 0,
                    failedPayments: 0,
                    failureRate: 0,
                    commonFailureReasons: []
                };
            }

            const events = data || [];
            const paymentAttempts = events.filter(e => e.event_type === 'approved').length;
            const paymentFailures = events.filter(e => e.event_type === 'payment_failed');

            const failureRate = paymentAttempts > 0 ? (paymentFailures.length / paymentAttempts) * 100 : 0;

            // Analyze failure reasons
            const reasonCounts: { [key: string]: number } = {};
            paymentFailures.forEach(failure => {
                const reason = failure.event_data?.payment_error || 'Unknown error';
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            });

            const commonFailureReasons = Object.entries(reasonCounts)
                .map(([reason, count]) => ({
                    reason,
                    count,
                    percentage: paymentFailures.length > 0 ? (count / paymentFailures.length) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count);

            return {
                totalPaymentAttempts: paymentAttempts,
                failedPayments: paymentFailures.length,
                failureRate,
                commonFailureReasons
            };
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getPaymentFailureMetrics error:', error);
            // Return default values if there's an error
            return {
                totalPaymentAttempts: 0,
                failedPayments: 0,
                failureRate: 0,
                commonFailureReasons: []
            };
        }
    }

    /**
     * Get rejection analysis
     */
    static async getRejectionAnalysis(dateRange?: { start: Date; end: Date }): Promise<RejectionAnalysis> {
        try {
            let query = supabase
                .from('bookings')
                .select('rejection_reason, request_submitted_at')
                .eq('status', 'REJECTED')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (dateRange) {
                query = query
                    .gte('request_submitted_at', dateRange.start.toISOString())
                    .lte('request_submitted_at', dateRange.end.toISOString());
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching rejection analysis:', error);
                throw error;
            }

            const rejections = data || [];
            const totalRejections = rejections.length;

            // Analyze rejection reasons
            const reasonCounts: { [key: string]: number } = {};
            rejections.forEach(rejection => {
                const reason = rejection.rejection_reason || 'No reason provided';
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            });

            const commonReasons = Object.entries(reasonCounts)
                .map(([reason, count]) => ({
                    reason,
                    count,
                    percentage: totalRejections > 0 ? (count / totalRejections) * 100 : 0
                }))
                .sort((a, b) => b.count - a.count);

            return {
                totalRejections,
                commonReasons
            };
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getRejectionAnalysis error:', error);
            throw error;
        }
    }

    /**
     * Get time analysis including overdue requests
     */
    static async getTimeAnalysis(): Promise<TimeAnalysis> {
        try {
            // Get all requests for processing time calculation
            const { data: allRequests, error: allError } = await supabase
                .from('bookings')
                .select('status, request_submitted_at, admin_reviewed_at')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (allError) {
                console.error('Error fetching requests for time analysis:', allError);
                throw allError;
            }

            // Calculate average processing time
            const completedRequests = (allRequests || []).filter(r => 
                r.status !== 'PENDING_CONFIRMATION' && 
                r.request_submitted_at && 
                r.admin_reviewed_at
            );

            let averageProcessingTime = 0;
            if (completedRequests.length > 0) {
                const totalProcessingTime = completedRequests.reduce((sum, request) => {
                    const submitted = new Date(request.request_submitted_at!);
                    const reviewed = new Date(request.admin_reviewed_at!);
                    return sum + (reviewed.getTime() - submitted.getTime());
                }, 0);
                averageProcessingTime = totalProcessingTime / completedRequests.length / (1000 * 60 * 60); // Convert to hours
            }

            // Get overdue requests (exceeding 24 hours)
            const { data: overdueData, error: overdueError } = await supabase
                .from('bookings')
                .select('id, customer_name, customer_email, tour_type, booking_date, request_submitted_at')
                .eq('status', 'PENDING_CONFIRMATION')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (overdueError) {
                console.error('Error fetching overdue requests:', overdueError);
                throw overdueError;
            }

            const now = new Date();
            const timeLimitHours = 24;
            const requestsExceedingTimeLimit = (overdueData || [])
                .filter(r => {
                    if (!r.request_submitted_at) return false;
                    const submitted = new Date(r.request_submitted_at);
                    const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
                    return hoursElapsed > timeLimitHours;
                })
                .map(r => {
                    const submitted = new Date(r.request_submitted_at!);
                    const hoursOverdue = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60) - timeLimitHours;
                    return {
                        ...r,
                        hoursOverdue: Math.round(hoursOverdue * 10) / 10 // Round to 1 decimal place
                    };
                })
                .sort((a, b) => b.hoursOverdue - a.hoursOverdue);

            return {
                averageProcessingTime,
                requestsExceedingTimeLimit
            };
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getTimeAnalysis error:', error);
            throw error;
        }
    }

    /**
     * Get payment failure rate
     */
    private static async getPaymentFailureRate(dateRange?: { start: Date; end: Date }): Promise<number> {
        try {
            // This would query booking_request_events for payment failures
            // For now, return a placeholder value
            return 0;
        } catch (error) {
            console.error('Error calculating payment failure rate:', error);
            return 0;
        }
    }

    /**
     * Get alerts for requests exceeding time limits
     */
    static async getTimeAlerts(): Promise<Array<{
        id: number;
        customer_name: string;
        customer_email: string;
        tour_type: string;
        booking_date: string;
        hoursOverdue: number;
        severity: 'warning' | 'critical';
    }>> {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('id, customer_name, customer_email, tour_type, booking_date, request_submitted_at')
                .eq('status', 'PENDING_CONFIRMATION')
                .in('tour_type', ['uji-tour', 'uji-walking-tour']);

            if (error) {
                console.error('Error fetching time alerts:', error);
                throw error;
            }

            const now = new Date();
            const warningThreshold = 24; // 24 hours
            const criticalThreshold = 48; // 48 hours

            return (data || [])
                .filter(r => {
                    if (!r.request_submitted_at) return false;
                    const submitted = new Date(r.request_submitted_at);
                    const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
                    return hoursElapsed > warningThreshold;
                })
                .map(r => {
                    const submitted = new Date(r.request_submitted_at!);
                    const hoursOverdue = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
                    return {
                        ...r,
                        hoursOverdue: Math.round(hoursOverdue * 10) / 10,
                        severity: hoursOverdue > criticalThreshold ? 'critical' as const : 'warning' as const
                    };
                })
                .sort((a, b) => b.hoursOverdue - a.hoursOverdue);
        } catch (error) {
            console.error('BookingRequestAnalyticsService.getTimeAlerts error:', error);
            throw error;
        }
    }
}