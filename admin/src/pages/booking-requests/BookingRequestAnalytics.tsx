import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    BookingRequestAnalyticsService, 
    DashboardMetrics 
} from '../../services/bookingRequestAnalyticsService';
import {
    ChartBarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CreditCardIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    UserGroupIcon,
    CheckCircleIcon,
    XCircleIcon,
    BellIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const BookingRequestAnalytics: React.FC = () => {
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
    });

    // Fetch analytics data
    const { data: metrics, isLoading, error, refetch } = useQuery({
        queryKey: ['booking-request-analytics', dateRange],
        queryFn: () => BookingRequestAnalyticsService.getDashboardMetrics(dateRange),
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    });

    // Fetch time alerts
    const { data: timeAlerts } = useQuery({
        queryKey: ['booking-request-time-alerts'],
        queryFn: () => BookingRequestAnalyticsService.getTimeAlerts(),
        refetchInterval: 60 * 1000, // Refresh every minute
    });

    const handleDateRangeChange = (range: 'week' | 'month' | 'quarter') => {
        const end = new Date();
        let start: Date;

        switch (range) {
            case 'week':
                start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
        }

        setDateRange({ start, end });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
                        <p className="mt-1 text-sm text-red-700">
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return <div>No data available</div>;
    }

    const { overview, conversionTrends, paymentFailures, rejectionAnalysis, timeAnalysis } = metrics;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Request Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Performance metrics and insights for Uji tour booking requests
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handleDateRangeChange('week')}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Last Week
                        </button>
                        <button
                            onClick={() => handleDateRangeChange('month')}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 bg-gray-100"
                        >
                            Last Month
                        </button>
                        <button
                            onClick={() => handleDateRangeChange('quarter')}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Last Quarter
                        </button>
                    </div>
                </div>
            </div>

            {/* Time Alerts */}
            {timeAlerts && timeAlerts.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <BellIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                {timeAlerts.length} Request{timeAlerts.length > 1 ? 's' : ''} Exceeding Time Limit
                            </h3>
                            <div className="mt-2 space-y-1">
                                {timeAlerts.slice(0, 3).map(alert => (
                                    <div key={alert.id} className="text-sm text-yellow-700">
                                        <span className="font-medium">{alert.customer_name}</span> - 
                                        {alert.hoursOverdue.toFixed(1)} hours overdue
                                        {alert.severity === 'critical' && (
                                            <span className="ml-2 text-red-600 font-medium">(Critical)</span>
                                        )}
                                    </div>
                                ))}
                                {timeAlerts.length > 3 && (
                                    <div className="text-sm text-yellow-600">
                                        And {timeAlerts.length - 3} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserGroupIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Requests
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {overview.totalRequests}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Conversion Rate
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {overview.conversionRate.toFixed(1)}%
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Avg Processing Time
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {overview.averageProcessingTime.toFixed(1)}h
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ExclamationTriangleIcon className={clsx(
                                    "h-6 w-6",
                                    overview.requestsExceedingTimeLimit > 0 ? "text-red-400" : "text-gray-400"
                                )} />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Overdue Requests
                                    </dt>
                                    <dd className={clsx(
                                        "text-lg font-medium",
                                        overview.requestsExceedingTimeLimit > 0 ? "text-red-600" : "text-gray-900"
                                    )}>
                                        {overview.requestsExceedingTimeLimit}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Request Status Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-2">
                            <ClockIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{overview.pendingRequests}</div>
                        <div className="text-sm text-gray-500">Pending</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-2">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{overview.approvedRequests}</div>
                        <div className="text-sm text-gray-500">Approved</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-2">
                            <XCircleIcon className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{overview.rejectedRequests}</div>
                        <div className="text-sm text-gray-500">Rejected</div>
                    </div>
                </div>
            </div>

            {/* Conversion Trends */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Trends</h3>
                {conversionTrends.length > 0 ? (
                    <div className="space-y-4">
                        {conversionTrends.map((trend, index) => (
                            <div key={trend.period} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-900">
                                        Week of {new Date(trend.period).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-500">
                                        {trend.totalRequests} requests
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {trend.conversionRate.toFixed(1)}% conversion
                                    </span>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${Math.min(trend.conversionRate, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No conversion data available for the selected period</p>
                )}
            </div>

            {/* Payment Failures */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <CreditCardIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Payment Success Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {paymentFailures.totalPaymentAttempts > 0 
                                ? (100 - paymentFailures.failureRate).toFixed(1)
                                : 'N/A'
                            }%
                        </div>
                        <div className="text-sm text-gray-500">
                            {paymentFailures.totalPaymentAttempts} total attempts
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Common Failure Reasons</div>
                        {paymentFailures.commonFailureReasons.length > 0 ? (
                            <div className="space-y-1">
                                {paymentFailures.commonFailureReasons.slice(0, 3).map((reason, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate">{reason.reason}</span>
                                        <span className="text-gray-900 font-medium">{reason.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No payment failures recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Rejection Analysis */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rejection Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                            {rejectionAnalysis.totalRejections}
                        </div>
                        <div className="text-sm text-gray-500">Total Rejections</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Common Rejection Reasons</div>
                        {rejectionAnalysis.commonReasons.length > 0 ? (
                            <div className="space-y-2">
                                {rejectionAnalysis.commonReasons.slice(0, 5).map((reason, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                                            {reason.reason}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm text-gray-900 font-medium">
                                                {reason.count}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                ({reason.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No rejections recorded</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Time Analysis */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Time Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <ClockIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Average Processing Time</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                            {timeAnalysis.averageProcessingTime.toFixed(1)} hours
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">
                            Overdue Requests ({timeAnalysis.requestsExceedingTimeLimit.length})
                        </div>
                        {timeAnalysis.requestsExceedingTimeLimit.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {timeAnalysis.requestsExceedingTimeLimit.slice(0, 5).map((request) => (
                                    <div key={request.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate">
                                            {request.customer_name}
                                        </span>
                                        <span className="text-red-600 font-medium">
                                            +{request.hoursOverdue.toFixed(1)}h
                                        </span>
                                    </div>
                                ))}
                                {timeAnalysis.requestsExceedingTimeLimit.length > 5 && (
                                    <div className="text-xs text-gray-500">
                                        And {timeAnalysis.requestsExceedingTimeLimit.length - 5} more...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-green-600">All requests processed within time limit</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingRequestAnalytics;