import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/outline';
import { usePendingRequestsCount } from '../../hooks/usePendingRequestsCount';
import { clsx } from 'clsx';

const BookingRequestsButton: React.FC = () => {
    const { data: pendingCount = 0, isLoading } = usePendingRequestsCount();

    return (
        <Link
            to="/booking-requests"
            className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
            <ClockIcon className="h-4 w-4 mr-1.5" />
            <span>Booking Requests</span>
            
            {/* Notification dot */}
            {!isLoading && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[1.25rem] h-5">
                    {pendingCount > 99 ? '99+' : pendingCount}
                </span>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-3 h-3 transform translate-x-1/2 -translate-y-1/2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
            )}
        </Link>
    );
};

export default BookingRequestsButton;