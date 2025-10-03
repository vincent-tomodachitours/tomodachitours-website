import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookingRequestMonitoring } from '../../hooks/useBookingRequestMonitoring';
import {
    ExclamationTriangleIcon,
    ClockIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface BookingRequestMonitoringAlertProps {
    className?: string;
}

const BookingRequestMonitoringAlert: React.FC<BookingRequestMonitoringAlertProps> = ({ 
    className 
}) => {
    const { monitoringData, hasAlerts, hasCriticalAlerts, dismissAlert } = useBookingRequestMonitoring();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    // Don't show if no alerts or dismissed
    if (!hasAlerts || isDismissed) {
        return null;
    }

    const { timeAlerts, criticalAlerts, warningAlerts } = monitoringData;

    const handleDismiss = () => {
        setIsDismissed(true);
        // Mark all current alerts as dismissed
        timeAlerts.forEach(alert => dismissAlert(alert.id));
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={clsx(
            "border rounded-lg shadow-sm",
            hasCriticalAlerts 
                ? "bg-red-50 border-red-200" 
                : "bg-yellow-50 border-yellow-200",
            className
        )}>
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon 
                                className={clsx(
                                    "h-5 w-5",
                                    hasCriticalAlerts ? "text-red-400" : "text-yellow-400"
                                )} 
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className={clsx(
                                "text-sm font-medium",
                                hasCriticalAlerts ? "text-red-800" : "text-yellow-800"
                            )}>
                                {timeAlerts.length} Booking Request{timeAlerts.length > 1 ? 's' : ''} Exceeding Time Limit
                            </h3>
                            <div className="mt-1 text-sm space-y-1">
                                {criticalAlerts > 0 && (
                                    <div className="text-red-700">
                                        <span className="font-medium">{criticalAlerts} critical</span> (over 48 hours)
                                    </div>
                                )}
                                {warningAlerts > 0 && (
                                    <div className={hasCriticalAlerts ? "text-red-600" : "text-yellow-700"}>
                                        <span className="font-medium">{warningAlerts} warning</span> (over 24 hours)
                                    </div>
                                )}
                            </div>
                            
                            {/* Quick preview of top alerts */}
                            {!isExpanded && timeAlerts.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {timeAlerts.slice(0, 2).map(alert => (
                                        <div key={alert.id} className={clsx(
                                            "text-xs flex items-center space-x-2",
                                            hasCriticalAlerts ? "text-red-600" : "text-yellow-600"
                                        )}>
                                            <ClockIcon className="h-3 w-3" />
                                            <span className="font-medium">{alert.customer_name}</span>
                                            <span>- {alert.hoursOverdue.toFixed(1)}h overdue</span>
                                            {alert.severity === 'critical' && (
                                                <span className="text-red-700 font-medium">(Critical)</span>
                                            )}
                                        </div>
                                    ))}
                                    {timeAlerts.length > 2 && (
                                        <div className={clsx(
                                            "text-xs",
                                            hasCriticalAlerts ? "text-red-600" : "text-yellow-600"
                                        )}>
                                            And {timeAlerts.length - 2} more...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded view */}
                            {isExpanded && (
                                <div className="mt-3 space-y-2">
                                    {timeAlerts.map(alert => (
                                        <div key={alert.id} className={clsx(
                                            "p-2 rounded border text-xs",
                                            alert.severity === 'critical' 
                                                ? "bg-red-100 border-red-200" 
                                                : "bg-yellow-100 border-yellow-200"
                                        )}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {alert.customer_name}
                                                    </div>
                                                    <div className="text-gray-600">
                                                        {alert.customer_email}
                                                    </div>
                                                    <div className="text-gray-600">
                                                        {alert.tour_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - {alert.booking_date}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={clsx(
                                                        "font-medium",
                                                        alert.severity === 'critical' ? "text-red-700" : "text-yellow-700"
                                                    )}>
                                                        {alert.hoursOverdue.toFixed(1)}h overdue
                                                    </div>
                                                    {alert.severity === 'critical' && (
                                                        <div className="text-red-600 text-xs font-medium">
                                                            CRITICAL
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-3 flex items-center space-x-3">
                                <Link
                                    to="/booking-requests"
                                    className={clsx(
                                        "text-sm font-medium underline hover:no-underline",
                                        hasCriticalAlerts ? "text-red-700" : "text-yellow-700"
                                    )}
                                >
                                    Review Requests
                                </Link>
                                <Link
                                    to="/booking-requests/analytics"
                                    className={clsx(
                                        "text-sm underline hover:no-underline",
                                        hasCriticalAlerts ? "text-red-600" : "text-yellow-600"
                                    )}
                                >
                                    View Analytics
                                </Link>
                                {timeAlerts.length > 2 && (
                                    <button
                                        onClick={toggleExpanded}
                                        className={clsx(
                                            "text-sm underline hover:no-underline flex items-center space-x-1",
                                            hasCriticalAlerts ? "text-red-600" : "text-yellow-600"
                                        )}
                                    >
                                        <span>{isExpanded ? 'Show Less' : 'Show All'}</span>
                                        {isExpanded ? (
                                            <ChevronUpIcon className="h-3 w-3" />
                                        ) : (
                                            <ChevronDownIcon className="h-3 w-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className={clsx(
                            "flex-shrink-0 p-1 rounded-md hover:bg-opacity-20",
                            hasCriticalAlerts 
                                ? "text-red-400 hover:bg-red-200" 
                                : "text-yellow-400 hover:bg-yellow-200"
                        )}
                        title="Dismiss alert"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingRequestMonitoringAlert;