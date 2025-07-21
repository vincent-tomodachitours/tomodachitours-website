import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { BookingService } from '../../services/bookingService';
import {
    UsersIcon,
    CalendarDaysIcon,
    CurrencyYenIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
    const { employee } = useAdminAuth();

    // Fetch dashboard statistics
    const { data: bookingStats, isLoading: statsLoading } = useQuery({
        queryKey: ['bookingStats'],
        queryFn: BookingService.getBookingStats,
        refetchInterval: 60000, // Refetch every minute
    });

    const quickActions = [
        { name: 'View Upcoming Bookings', href: '/bookings', description: 'See all upcoming bookings' },
        { name: 'Manage Guides', href: '/employees', description: 'View and assign tour guides' },
        { name: 'Tour Availability', href: '/tours', description: 'Manage tour schedules and capacity' },
        { name: 'Analytics', href: '/analytics', description: 'View performance reports' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                            Welcome back, {employee?.first_name}!
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {employee?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} •
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            New Booking
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Today's Bookings */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CalendarDaysIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Today's Bookings
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {statsLoading ? '...' : bookingStats?.todayBookings || 0}
                                    </dd>
                                    {bookingStats?.todayParticipants && bookingStats.todayParticipants > 0 && (
                                        <dd className="text-sm text-gray-500">
                                            {bookingStats.todayParticipants} participants
                                        </dd>
                                    )}
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Guides */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UsersIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Active Guides
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {statsLoading ? '...' : bookingStats?.activeGuides || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weekly Revenue */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CurrencyYenIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Weekly Revenue
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {statsLoading ? '...' : `¥${bookingStats?.weeklyRevenue?.toLocaleString() || 0}`}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Tours */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ClockIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Upcoming Tours (7 days)
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {statsLoading ? '...' : bookingStats?.upcomingTours || 0}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg mb-8">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {quickActions.map((action) => (
                            <div
                                key={action.name}
                                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 cursor-pointer"
                            >
                                <div>
                                    <a href={action.href} className="focus:outline-none">
                                        <span className="absolute inset-0" aria-hidden="true" />
                                        <p className="text-sm font-medium text-gray-900">{action.name}</p>
                                        <p className="text-sm text-gray-500">{action.description}</p>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Activity</h3>
                    <div className="text-sm text-gray-500">
                        <p>Activity feed will be implemented in the next phase...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 