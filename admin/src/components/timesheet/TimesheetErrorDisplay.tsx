/**
 * User-friendly error display component for timesheet operations
 * Implements user-friendly error messages and recovery options as per requirements 5.1, 5.2, 5.3
 */

import React, { useState, useCallback } from 'react';
import {
    ExclamationTriangleIcon,
    XCircleIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    WifiIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { TimesheetError } from '../../services/timesheetErrorHandler';

interface TimesheetErrorDisplayProps {
    error: TimesheetError | null;
    onRetry?: () => void;
    onRefresh?: () => void;
    onDismiss?: () => void;
    className?: string;
    showDetails?: boolean;
}

export const TimesheetErrorDisplay: React.FC<TimesheetErrorDisplayProps> = ({
    error,
    onRetry,
    onRefresh,
    onDismiss,
    className = '',
    showDetails = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = useCallback(async () => {
        if (!onRetry) return;

        setIsRetrying(true);
        try {
            await onRetry();
        } finally {
            setIsRetrying(false);
        }
    }, [onRetry]);

    if (!error) return null;

    const getErrorIcon = () => {
        switch (error.type) {
            case 'network':
                return <WifiIcon className="h-5 w-5" />;
            case 'validation':
                return <InformationCircleIcon className="h-5 w-5" />;
            case 'conflict':
                return <ClockIcon className="h-5 w-5" />;
            case 'server':
            case 'permission':
            default:
                return error.severity === 'critical' ?
                    <XCircleIcon className="h-5 w-5" /> :
                    <ExclamationTriangleIcon className="h-5 w-5" />;
        }
    };

    const getErrorColors = () => {
        switch (error.severity) {
            case 'critical':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: 'text-red-600',
                    button: 'text-red-700 hover:text-red-900'
                };
            case 'high':
                return {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-800',
                    icon: 'text-orange-600',
                    button: 'text-orange-700 hover:text-orange-900'
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: 'text-yellow-600',
                    button: 'text-yellow-700 hover:text-yellow-900'
                };
            case 'low':
            default:
                return {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-800',
                    icon: 'text-blue-600',
                    button: 'text-blue-700 hover:text-blue-900'
                };
        }
    };

    const colors = getErrorColors();

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 ${className}`}>
            <div className="flex items-start">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                    {getErrorIcon()}
                </div>

                <div className="ml-3 flex-1">
                    {/* Error Message */}
                    <div className={`text-sm font-medium ${colors.text}`}>
                        {error.userMessage}
                    </div>

                    {/* Error Context */}
                    {error.context.operation && (
                        <div className={`text-xs ${colors.text} opacity-75 mt-1`}>
                            Operation: {error.context.operation.replace('_', ' ')} • {formatTimestamp(error.timestamp)}
                        </div>
                    )}

                    {/* Suggested Actions */}
                    {error.recoveryOptions.suggestedActions.length > 0 && (
                        <div className="mt-3">
                            <div className={`text-xs font-medium ${colors.text} mb-2`}>
                                What you can do:
                            </div>
                            <ul className={`text-xs ${colors.text} space-y-1`}>
                                {error.recoveryOptions.suggestedActions.map((action, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {error.recoveryOptions.canRetry && onRetry && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRetry}
                                loading={isRetrying}
                                className={`${colors.button} border ${colors.border}`}
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-1" />
                                Try Again
                            </Button>
                        )}

                        {error.recoveryOptions.canRefresh && onRefresh && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRefresh}
                                className={`${colors.button} border ${colors.border}`}
                            >
                                Refresh
                            </Button>
                        )}

                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDismiss}
                                className={`${colors.button}`}
                            >
                                Dismiss
                            </Button>
                        )}

                        {showDetails && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`${colors.button}`}
                            >
                                {isExpanded ? 'Hide' : 'Show'} Details
                            </Button>
                        )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && showDetails && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="font-medium">Error ID:</span> {error.id}
                                </div>
                                <div>
                                    <span className="font-medium">Type:</span> {error.type}
                                </div>
                                <div>
                                    <span className="font-medium">Severity:</span> {error.severity}
                                </div>
                                {error.context.employeeId && (
                                    <div>
                                        <span className="font-medium">Employee ID:</span> {error.context.employeeId}
                                    </div>
                                )}
                                {error.context.timesheetId && (
                                    <div>
                                        <span className="font-medium">Timesheet ID:</span> {error.context.timesheetId}
                                    </div>
                                )}
                                {error.context.attemptCount && (
                                    <div>
                                        <span className="font-medium">Attempt:</span> {error.context.attemptCount}
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium">Technical Message:</span> {error.message}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Multiple errors display component
 */
interface TimesheetErrorListProps {
    errors: TimesheetError[];
    onRetry?: (errorId: string) => void;
    onRefresh?: () => void;
    onDismiss?: (errorId: string) => void;
    onDismissAll?: () => void;
    className?: string;
    maxVisible?: number;
}

export const TimesheetErrorList: React.FC<TimesheetErrorListProps> = ({
    errors,
    onRetry,
    onRefresh,
    onDismiss,
    onDismissAll,
    className = '',
    maxVisible = 3
}) => {
    const [showAll, setShowAll] = useState(false);

    if (errors.length === 0) return null;

    const visibleErrors = showAll ? errors : errors.slice(0, maxVisible);
    const hasMore = errors.length > maxVisible;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header */}
            {errors.length > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">
                        {errors.length} issue{errors.length !== 1 ? 's' : ''} found
                    </div>
                    {onDismissAll && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDismissAll}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Dismiss All
                        </Button>
                    )}
                </div>
            )}

            {/* Error List */}
            {visibleErrors.map((error) => (
                <TimesheetErrorDisplay
                    key={error.id}
                    error={error}
                    onRetry={onRetry ? () => onRetry(error.id) : undefined}
                    onRefresh={onRefresh}
                    onDismiss={onDismiss ? () => onDismiss(error.id) : undefined}
                    showDetails={errors.length === 1}
                />
            ))}

            {/* Show More/Less */}
            {hasMore && (
                <div className="text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {showAll ? 'Show Less' : `Show ${errors.length - maxVisible} More`}
                    </Button>
                </div>
            )}
        </div>
    );
};

/**
 * Network status error component
 */
interface NetworkErrorDisplayProps {
    isOnline: boolean;
    isReconnecting: boolean;
    lastOnlineTime: Date | null;
    onRetryConnection?: () => void;
    className?: string;
}

export const NetworkErrorDisplay: React.FC<NetworkErrorDisplayProps> = ({
    isOnline,
    isReconnecting,
    lastOnlineTime,
    onRetryConnection,
    className = ''
}) => {
    if (isOnline) return null;

    const formatLastOnlineTime = () => {
        if (!lastOnlineTime) return 'Unknown';

        const now = new Date();
        const diffMs = now.getTime() - lastOnlineTime.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    };

    return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 text-red-600">
                    <WifiIcon className="h-5 w-5" />
                </div>

                <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-red-800">
                        {isReconnecting ? 'Reconnecting...' : 'You are offline'}
                    </div>

                    <div className="text-xs text-red-600 mt-1">
                        Last online: {formatLastOnlineTime()}
                    </div>

                    <div className="text-xs text-red-700 mt-2">
                        • Clock in/out operations will be queued until connection is restored
                        • Data may not be up to date
                        • Check your internet connection
                    </div>

                    {onRetryConnection && !isReconnecting && (
                        <div className="mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRetryConnection}
                                className="text-red-700 hover:text-red-900 border border-red-200"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-1" />
                                Retry Connection
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};