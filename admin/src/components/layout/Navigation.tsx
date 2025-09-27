import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
    HomeIcon,
    CalendarDaysIcon,
    UsersIcon,
    ClockIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    CheckCircleIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const Navigation: React.FC = () => {
    const { employee, signOut, hasPermission } = useAdminAuth();
    const location = useLocation();

    // Determine the bookings page name based on user role
    const bookingsPageName = hasPermission('manage_employees') || hasPermission('edit_bookings')
        ? 'Bookings'
        : 'My Bookings';

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: HomeIcon,
            permission: null, // Available to all authenticated users
        },
        {
            name: bookingsPageName,
            href: '/bookings',
            icon: CalendarDaysIcon,
            permission: 'view_bookings' as const,
        },
        {
            name: 'My Availability',
            href: '/availability',
            icon: CheckCircleIcon,
            permission: 'manage_own_availability' as const,
        },
        {
            name: 'Timesheet',
            href: '/timesheet',
            icon: DocumentTextIcon,
            permission: null, // Available to all authenticated users
        },
        {
            name: 'Employees',
            href: '/employees',
            icon: UsersIcon,
            permission: 'manage_employees' as const,
        },
        {
            name: 'Schedule',
            href: '/schedule',
            icon: ClockIcon,
            permission: 'manage_employees' as const,
        },
        {
            name: 'Tours',
            href: '/tours',
            icon: Cog6ToothIcon,
            permission: 'manage_tours' as const,
        },
        {
            name: 'Analytics',
            href: '/analytics',
            icon: ChartBarIcon,
            permission: 'view_analytics' as const,
        },
    ];

    const filteredNavigation = navigation.filter(
        item => !item.permission || hasPermission(item.permission)
    );

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-12">
                    {/* Logo and main navigation */}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <img
                                src="/favicon.ico"
                                alt="Tomodachi Tours"
                                className="h-6 w-6"
                            />
                        </div>
                        <nav className="hidden md:ml-4 md:flex md:space-x-4">
                            {filteredNavigation.map((item) => {
                                const isActive = location.pathname === item.href ||
                                    (item.href === '/timesheet' && location.pathname.startsWith('/timesheet'));
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={clsx(
                                            'inline-flex items-center px-1 pt-1 border-b-2 text-xs font-medium',
                                            isActive
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4 mr-1" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* User menu */}
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-700">
                            {employee?.first_name} {employee?.last_name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                            {employee?.role}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                            title="Sign Out"
                        >
                            <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile navigation */}
            <div className="md:hidden">
                <div className="pt-2 pb-3 space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = location.pathname === item.href ||
                            (item.href === '/timesheet' && location.pathname.startsWith('/timesheet'));
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                                    isActive
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                                )}
                            >
                                <div className="flex items-center">
                                    <item.icon className="h-5 w-5 mr-3" />
                                    {item.name}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Navigation; 