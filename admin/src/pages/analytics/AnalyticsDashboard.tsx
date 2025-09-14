import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    UsersIcon,
    CalendarDaysIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ArrowDownTrayIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { AnalyticsService } from '../../services/analyticsService';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { format, subDays } from 'date-fns';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const AnalyticsDashboard: React.FC = () => {
    // State for date range filter
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);

    // Calculate date range
    const actualDateRange = useMemo(() => {
        const end = new Date();
        let start: Date;

        switch (dateRange) {
            case '7d':
                start = subDays(end, 7);
                break;
            case '30d':
                start = subDays(end, 30);
                break;
            case '90d':
                start = subDays(end, 90);
                break;
            case 'custom':
                return customDateRange;
            default:
                start = subDays(end, 30);
        }

        return { start, end };
    }, [dateRange, customDateRange]);

    // Fetch analytics data
    const {
        data: analytics,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['analytics', actualDateRange],
        queryFn: () => AnalyticsService.getAnalyticsOverview(actualDateRange || undefined),
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });

    // Color schemes for charts
    const tourTypeColors: Record<string, string> = {
        'NIGHT_TOUR': '#8B5CF6',
        'MORNING_TOUR': '#F59E0B',
        'UJI_TOUR': '#10B981',
        'UJI_WALKING_TOUR': '#06B6D4',
        'GION_TOUR': '#F97316',
        'MUSIC_TOUR': '#EC4899',
        'UJI_TOUR': '#10B981',
        'UJI_WALKING_TOUR': '#06B6D4',
        'GION_TOUR': '#3B82F6'
    };

    const statusColors = {
        'PENDING': '#F59E0B',
        'CONFIRMED': '#10B981',
        'CANCELLED': '#EF4444',
        'REFUNDED': '#6B7280'
    };

    const handleExport = async (exportFormat: 'json' | 'csv') => {
        try {
            const data = await AnalyticsService.exportAnalyticsData(exportFormat, actualDateRange || undefined);

            // Create download
            const blob = new Blob([data], {
                type: exportFormat === 'csv' ? 'text/csv' : 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `analytics-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error loading analytics: {error.message}</div>
                <Button onClick={() => refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-600">No analytics data available</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Business insights and performance metrics
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Date Range Selector */}
                    <div className="flex items-center space-x-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="custom">Custom range</option>
                        </select>
                    </div>

                    {/* Export Buttons */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        className="flex items-center"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExport('json')}
                        className="flex items-center"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Export JSON
                    </Button>
                </div>
            </div>

            {/* Custom Date Range Inputs */}
            {dateRange === 'custom' && (
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                onChange={(e) => setCustomDateRange(prev => ({
                                    start: new Date(e.target.value),
                                    end: prev?.end || new Date()
                                }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                onChange={(e) => setCustomDateRange(prev => ({
                                    start: prev?.start || new Date(),
                                    end: new Date(e.target.value)
                                }))}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Bookings"
                    value={analytics.totalBookings}
                    icon={CalendarDaysIcon}
                    color="blue"
                    trend="+12.3%"
                    trendUp={true}
                />
                <MetricCard
                    title="Total Revenue"
                    value={`$${analytics.totalRevenue.toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="green"
                    trend="+8.7%"
                    trendUp={true}
                />
                <MetricCard
                    title="Total Customers"
                    value={analytics.totalCustomers}
                    icon={UsersIcon}
                    color="purple"
                    trend="+15.2%"
                    trendUp={true}
                />
                <MetricCard
                    title="Active Employees"
                    value={analytics.totalEmployees}
                    icon={ChartBarIcon}
                    color="orange"
                    trend="+2.1%"
                    trendUp={true}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings Trend Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.bookingTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} />
                            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Tour Type Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookings by Tour Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.bookingsByTourType}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ tourType, percentage }) => `${tourType}: ${percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="count"
                            >
                                {analytics.bookingsByTourType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={tourTypeColors[entry.tourType] || '#6B7280'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Tour Type */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Tour Type</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.revenueByTourType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="tourType" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Booking Status Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.bookingsByStatus}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count">
                                {analytics.bookingsByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performing Guides */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Guides</h3>
                    <div className="space-y-3">
                        {analytics.topPerformingGuides.map((guide, index) => (
                            <div key={guide.guide.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-600">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {guide.guide.first_name} {guide.guide.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {guide.bookings} bookings
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        ${guide.revenue.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Indicators */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Conversion Rate</span>
                            <span className="text-sm font-medium text-gray-900">
                                {analytics.conversionRate.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg. Booking Value</span>
                            <span className="text-sm font-medium text-gray-900">
                                ${analytics.averageBookingValue.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Avg. Lead Time</span>
                            <span className="text-sm font-medium text-gray-900">
                                {analytics.averageBookingLeadTime.toFixed(1)} days
                            </span>
                        </div>
                    </div>
                </div>

                {/* Shift Utilization */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shift Utilization</h3>
                    <div className="space-y-3">
                        {analytics.shiftsByStatus.map((status) => (
                            <div key={status.status} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Badge variant="default" size="sm">
                                        {status.status}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {status.count} ({status.percentage.toFixed(1)}%)
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Metric Card Component
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'purple' | 'orange';
    trend?: string;
    trendUp?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, trend, trendUp }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {trend && (
                        <div className="flex items-center mt-1">
                            {trendUp ? (
                                <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                                <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                {trend}
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard; 