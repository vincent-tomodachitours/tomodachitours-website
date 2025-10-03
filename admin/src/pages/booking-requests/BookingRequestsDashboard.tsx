import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    BookingRequestService, 
    BookingRequest, 
    BookingRequestFilters 
} from '../../services/bookingRequestService';
import { 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
    CreditCardIcon,
    InformationCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const BookingRequestsDashboard: React.FC = () => {
    const [filters, setFilters] = useState<BookingRequestFilters>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionResult, setActionResult] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
        details?: string;
    } | null>(null);
    const queryClient = useQueryClient();

    // Fetch booking requests
    const { data: requests = [], isLoading, error } = useQuery({
        queryKey: ['booking-requests', filters],
        queryFn: () => BookingRequestService.getBookingRequests(filters),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: (bookingId: number) => BookingRequestService.approveRequest(bookingId),
        onSuccess: (data, bookingId) => {
            queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
            queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
            setShowApproveModal(false);
            setSelectedRequest(null);
            setActionResult({
                type: 'success',
                message: `Booking request approved successfully!`,
                details: 'Payment has been processed and confirmation email sent to customer.'
            });
        },
        onError: (error: any) => {
            setShowApproveModal(false);
            setSelectedRequest(null);
            
            // Handle specific payment failure errors
            if (error?.message?.includes('Payment processing failed')) {
                setActionResult({
                    type: 'warning',
                    message: 'Approval processed but payment failed',
                    details: 'The booking request has been approved but payment processing failed. The customer and admin team have been notified. You may need to retry payment processing or contact the customer directly.'
                });
            } else {
                setActionResult({
                    type: 'error',
                    message: 'Failed to approve booking request',
                    details: error?.message || 'An unexpected error occurred while processing the approval.'
                });
            }
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
        mutationFn: ({ bookingId, reason }: { bookingId: number; reason: string }) => 
            BookingRequestService.rejectRequest(bookingId, reason),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
            queryClient.invalidateQueries({ queryKey: ['pending-requests-count'] });
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            setActionResult({
                type: 'success',
                message: 'Booking request rejected successfully',
                details: 'Rejection notification email has been sent to the customer.'
            });
        },
        onError: (error: any) => {
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            setActionResult({
                type: 'error',
                message: 'Failed to reject booking request',
                details: error?.message || 'An unexpected error occurred while processing the rejection.'
            });
        },
    });

    // Handle search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters(prev => ({ ...prev, searchQuery }));
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleApprove = (request: BookingRequest) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
        setActionResult(null); // Clear any previous results
    };

    const handleReject = (request: BookingRequest) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
        setActionResult(null); // Clear any previous results
    };

    const handleApproveConfirm = () => {
        if (selectedRequest) {
            approveMutation.mutate(selectedRequest.id);
        }
    };

    const handleRejectConfirm = () => {
        if (selectedRequest && rejectionReason.trim()) {
            rejectMutation.mutate({
                bookingId: selectedRequest.id,
                reason: rejectionReason.trim()
            });
        }
    };

    const dismissActionResult = () => {
        setActionResult(null);
    };

    // Auto-dismiss success notifications after 5 seconds
    useEffect(() => {
        if (actionResult && actionResult.type === 'success') {
            const timer = setTimeout(() => {
                setActionResult(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [actionResult]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_CONFIRMATION':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                );
            case 'CONFIRMED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Confirmed
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircleIcon className="w-3 h-3 mr-1" />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const formatTourType = (tourType: string) => {
        return tourType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatDateTime = (date: string, time: string) => {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        <h3 className="text-sm font-medium text-red-800">Error loading booking requests</h3>
                        <p className="mt-1 text-sm text-red-700">
                            {error instanceof Error ? error.message : 'An unexpected error occurred'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage Uji tour booking requests that require manual confirmation
                    </p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <a
                        href="/booking-requests/analytics"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ChartBarIcon className="w-4 h-4 mr-2" />
                        View Analytics
                    </a>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="sm:w-48">
                        <select
                            value={filters.status?.[0] || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                status: e.target.value ? [e.target.value] : undefined
                            }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING_CONFIRMATION">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {requests.length === 0 ? (
                    <div className="text-center py-12">
                        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No booking requests</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {filters.status?.[0] === 'PENDING_CONFIRMATION' 
                                ? 'No pending booking requests at the moment.'
                                : 'No booking requests match your current filters.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tour
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Participants
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {request.customer_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.customer_email}
                                                </div>
                                                {request.customer_phone && (
                                                    <div className="text-sm text-gray-500">
                                                        {request.customer_phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatTourType(request.tour_type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDateTime(request.booking_date, request.booking_time)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {request.adults} adults
                                                {request.children > 0 && `, ${request.children} children`}
                                                {request.infants > 0 && `, ${request.infants} infants`}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Total: {request.total_participants}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {request.request_submitted_at 
                                                ? new Date(request.request_submitted_at).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {request.status === 'PENDING_CONFIRMATION' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleApprove(request)}
                                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {approveMutation.isPending && selectedRequest?.id === request.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-white mr-1"></div>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request)}
                                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {rejectMutation.isPending && selectedRequest?.id === request.id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-white mr-1"></div>
                                                                Rejecting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircleIcon className="w-3 h-3 mr-1" />
                                                                Reject
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            {request.status === 'CONFIRMED' && (
                                                <div className="text-xs text-green-600 font-medium">
                                                    ✓ Payment Processed
                                                </div>
                                            )}
                                            {request.status === 'REJECTED' && request.rejection_reason && (
                                                <div className="text-xs text-gray-500 max-w-xs">
                                                    <div className="font-medium text-red-600 mb-1">Rejected</div>
                                                    <div className="truncate" title={request.rejection_reason}>
                                                        Reason: {request.rejection_reason}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Result Notification */}
            {actionResult && (
                <div className="fixed top-4 right-4 z-50 max-w-md">
                    <div className={clsx(
                        "rounded-md p-4 shadow-lg",
                        {
                            'bg-green-50 border border-green-200': actionResult.type === 'success',
                            'bg-red-50 border border-red-200': actionResult.type === 'error',
                            'bg-yellow-50 border border-yellow-200': actionResult.type === 'warning'
                        }
                    )}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {actionResult.type === 'success' && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                )}
                                {actionResult.type === 'error' && (
                                    <XCircleIcon className="h-5 w-5 text-red-400" />
                                )}
                                {actionResult.type === 'warning' && (
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className={clsx(
                                    "text-sm font-medium",
                                    {
                                        'text-green-800': actionResult.type === 'success',
                                        'text-red-800': actionResult.type === 'error',
                                        'text-yellow-800': actionResult.type === 'warning'
                                    }
                                )}>
                                    {actionResult.message}
                                </h3>
                                {actionResult.details && (
                                    <p className={clsx(
                                        "mt-1 text-sm",
                                        {
                                            'text-green-700': actionResult.type === 'success',
                                            'text-red-700': actionResult.type === 'error',
                                            'text-yellow-700': actionResult.type === 'warning'
                                        }
                                    )}>
                                        {actionResult.details}
                                    </p>
                                )}
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    onClick={dismissActionResult}
                                    className={clsx(
                                        "rounded-md p-1.5 inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2",
                                        {
                                            'text-green-500 hover:bg-green-100 focus:ring-green-600': actionResult.type === 'success',
                                            'text-red-500 hover:bg-red-100 focus:ring-red-600': actionResult.type === 'error',
                                            'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600': actionResult.type === 'warning'
                                        }
                                    )}
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center">
                                <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Approve Booking Request
                                </h3>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    Are you sure you want to approve {selectedRequest.customer_name}'s booking request?
                                </p>
                                <div className="bg-gray-50 rounded-md p-3 mb-4">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 mb-2">Booking Details:</div>
                                        <div className="space-y-1 text-gray-600">
                                            <div>Tour: {selectedRequest.tour_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                            <div>Date: {new Date(selectedRequest.booking_date).toLocaleDateString()}</div>
                                            <div>Time: {selectedRequest.booking_time}</div>
                                            <div>Participants: {selectedRequest.adults} adults{selectedRequest.children > 0 && `, ${selectedRequest.children} children`}</div>
                                            <div className="font-medium text-gray-900">Total: ¥{selectedRequest.total_amount?.toLocaleString() || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="flex">
                                        <CreditCardIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <div className="font-medium">Payment Processing</div>
                                            <div>The customer's payment method will be charged immediately upon approval.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    disabled={approveMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApproveConfirm}
                                    disabled={approveMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
                                >
                                    {approveMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                                            Approve & Process Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center">
                                <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
                                <h3 className="text-lg font-medium text-gray-900">
                                    Reject Booking Request
                                </h3>
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    Please provide a reason for rejecting {selectedRequest.customer_name}'s booking request:
                                </p>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    <div className="flex">
                                        <InformationCircleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                                        <div className="text-sm text-yellow-700">
                                            The customer will receive an email notification with your rejection reason.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setSelectedRequest(null);
                                        setRejectionReason('');
                                    }}
                                    disabled={rejectMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectConfirm}
                                    disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                                >
                                    {rejectMutation.isPending ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                            Rejecting...
                                        </>
                                    ) : (
                                        <>
                                            <XCircleIcon className="w-4 h-4 mr-1" />
                                            Reject Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingRequestsDashboard;