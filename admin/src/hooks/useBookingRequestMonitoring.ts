import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookingRequestAnalyticsService } from '../services/bookingRequestAnalyticsService';

export interface TimeAlert {
    id: number;
    customer_name: string;
    customer_email: string;
    tour_type: string;
    booking_date: string;
    hoursOverdue: number;
    severity: 'warning' | 'critical';
}

export interface MonitoringData {
    overdueRequests: number;
    criticalAlerts: number;
    warningAlerts: number;
    timeAlerts: TimeAlert[];
    lastUpdated: Date;
}

/**
 * Hook for monitoring booking request time limits and alerts
 */
export const useBookingRequestMonitoring = (options?: {
    enabled?: boolean;
    refetchInterval?: number;
}) => {
    const { enabled = true, refetchInterval = 60000 } = options || {}; // Default 1 minute refresh

    const [alertsShown, setAlertsShown] = useState<Set<number>>(new Set());

    // Fetch time alerts
    const { 
        data: timeAlerts = [], 
        isLoading, 
        error,
        refetch 
    } = useQuery({
        queryKey: ['booking-request-time-alerts'],
        queryFn: () => BookingRequestAnalyticsService.getTimeAlerts(),
        enabled,
        refetchInterval,
        staleTime: 30000, // Consider data stale after 30 seconds
    });

    // Process monitoring data
    const monitoringData: MonitoringData = {
        overdueRequests: timeAlerts.length,
        criticalAlerts: timeAlerts.filter(alert => alert.severity === 'critical').length,
        warningAlerts: timeAlerts.filter(alert => alert.severity === 'warning').length,
        timeAlerts,
        lastUpdated: new Date()
    };

    // Check for new critical alerts
    useEffect(() => {
        const newCriticalAlerts = timeAlerts.filter(
            alert => alert.severity === 'critical' && !alertsShown.has(alert.id)
        );

        if (newCriticalAlerts.length > 0) {
            // Mark these alerts as shown
            setAlertsShown(prev => {
                const newSet = new Set(prev);
                newCriticalAlerts.forEach(alert => newSet.add(alert.id));
                return newSet;
            });

            // Trigger browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
                newCriticalAlerts.forEach(alert => {
                    new Notification('Critical Booking Request Alert', {
                        body: `${alert.customer_name}'s request is ${alert.hoursOverdue.toFixed(1)} hours overdue`,
                        icon: '/favicon.ico',
                        tag: `booking-alert-${alert.id}` // Prevent duplicate notifications
                    });
                });
            }
        }
    }, [timeAlerts, alertsShown]);

    // Request notification permission on first use
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return {
        monitoringData,
        isLoading,
        error,
        refetch,
        hasAlerts: timeAlerts.length > 0,
        hasCriticalAlerts: monitoringData.criticalAlerts > 0,
        dismissAlert: (alertId: number) => {
            setAlertsShown(prev => {
                const newSet = new Set(prev);
                newSet.add(alertId);
                return newSet;
            });
        }
    };
};

/**
 * Hook for getting summary monitoring stats (lighter weight)
 */
export const useBookingRequestStats = () => {
    const { data: overview } = useQuery({
        queryKey: ['booking-request-overview'],
        queryFn: () => BookingRequestAnalyticsService.getOverviewMetrics(),
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
        staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
    });

    return {
        totalRequests: overview?.totalRequests || 0,
        pendingRequests: overview?.pendingRequests || 0,
        overdueRequests: overview?.requestsExceedingTimeLimit || 0,
        conversionRate: overview?.conversionRate || 0,
        averageProcessingTime: overview?.averageProcessingTime || 0
    };
};