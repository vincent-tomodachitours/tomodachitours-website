import React, { useState, useEffect } from 'react';
import Header from './Headers/Header1';
import Footer from './Footer';
import { supabase } from '../lib/supabase';
import { fetchTours } from '../services/toursService';
import { Link } from 'react-router-dom';
import { trackCustomGoogleAdsConversion } from '../services/googleAdsTracker';
import remarketingManager from '../services/remarketingManager';
import attributionService from '../services/attributionService';

const BookingCancellation = () => {
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState({});
    const [message, setMessage] = useState('');
    const [tours, setTours] = useState(null);

    // Load tour data for pricing and names
    useEffect(() => {
        const loadTours = async () => {
            try {
                const toursData = await fetchTours();
                setTours(toursData);
            } catch (error) {
                setMessage('Failed to load tour data');
            }
        };
        loadTours();
    }, []);

    // Helper function to get tour name from tour type
    const getTourName = (tourType) => {
        if (!tours) return tourType;

        const tourKey = {
            'NIGHT_TOUR': 'night-tour',
            'MORNING_TOUR': 'morning-tour',
            'UJI_TOUR': 'uji-tour',
            'UJI_WALKING_TOUR': 'uji-walking-tour',
            'GION_TOUR': 'gion-tour'
        }[tourType];

        return tours[tourKey]?.['tour-title'] || tourType;
    };

    // Helper function to get refund amount - ONLY use the actual paid amount from database
    const calculateRefundAmount = (booking) => {
        console.log('Booking data for refund calculation:', {
            id: booking.id,
            paid_amount: booking.paid_amount,
            discount_amount: booking.discount_amount,
            discount_code: booking.discount_code,
            tour_type: booking.tour_type
        });

        // ONLY return the actual paid amount from the database
        // If paid_amount is missing, return 0 (don't calculate anything)
        const refundAmount = booking.paid_amount || 0;
        console.log('Refund amount (paid_amount only):', refundAmount);

        return refundAmount;
    };

    // Helper function to get tour URL from tour type
    const getTourUrl = (tourType) => {
        const urlMap = {
            'NIGHT_TOUR': '/tours/kyoto-fushimi-inari-night-walking-tour',
            'MORNING_TOUR': '/tours/kyoto-early-bird-english-tour',
            'UJI_TOUR': '/tours/kyoto-uji-tea-tour',
            'GION_TOUR': '/tours/kyoto-gion-early-morning-walking-tour'
        };
        return urlMap[tourType] || '/tours';
    };

    const handleLookupBookings = async () => {
        if (!email.trim()) return;

        setLoading(true);
        setMessage('');

        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .ilike('customer_email', email) // case-insensitive
                .order('booking_date', { ascending: false })
                .order('booking_time', { ascending: false });

            if (error) {
                setMessage('Failed to lookup bookings');
                setBookings([]);
            } else if (!data || data.length === 0) {
                setMessage('No bookings found for this email address');
                setBookings([]);
            } else {
                setBookings(data);
            }
        } catch (error) {
            setMessage('Failed to lookup bookings');
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (booking) => {
        // Prevent multiple clicks on the same booking
        if (cancelling[booking.id]) {
            return;
        }

        const tourName = getTourName(booking.tour_type);
        const refundAmount = calculateRefundAmount(booking);

        const confirmMessage = `Are you sure you want to cancel your booking for "${tourName}" on ${booking.booking_date} at ${booking.booking_time}?\n\nRefund amount: ¥${refundAmount.toLocaleString('en-US')}`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setCancelling(prev => ({ ...prev, [booking.id]: true }));
        setMessage(''); // Clear any previous messages

        try {
            if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
                throw new Error('Missing Supabase configuration');
            }

            // Call Supabase Edge Function for refund processing
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/process-refund`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    email: email
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error('Failed to process cancellation request');
            }

            const result = await response.json();

            if (result.success) {
                // Track booking cancellation for Google Ads and remarketing
                try {
                    const cancellationData = {
                        bookingId: booking.id,
                        tourId: booking.tour_type.toLowerCase().replace('_', '-'),
                        tourName: getTourName(booking.tour_type),
                        refundAmount: refundAmount,
                        originalValue: booking.paid_amount || refundAmount,
                        customerEmail: email,
                        customerName: booking.customer_name,
                        bookingDate: booking.booking_date,
                        bookingTime: booking.booking_time,
                        cancellationTimestamp: Date.now(),
                        cancellationReason: 'customer_initiated',
                        attribution: attributionService.getAttributionForAnalytics()
                    };

                    // Track Google Ads cancellation conversion
                    trackCustomGoogleAdsConversion('booking_cancellation', {
                        value: cancellationData.refundAmount,
                        currency: 'JPY',
                        transaction_id: cancellationData.bookingId,
                        tour_id: cancellationData.tourId,
                        tour_name: cancellationData.tourName,
                        cancellation_reason: 'customer_initiated',
                        refund_amount: cancellationData.refundAmount,
                        days_before_tour: Math.ceil((getBookingDateTime(booking) - Date.now()) / (24 * 60 * 60 * 1000)),
                        customer_email_hash: btoa(email).substring(0, 10), // Hashed email for privacy
                        cancellation_page: 'booking_cancellation'
                    });

                    // Remove user from remarketing audiences
                    const userId = email; // Use email as user identifier for remarketing

                    // Remove from all acquisition and engagement audiences
                    const audiencesToRemove = [
                        'cart_abandoners',
                        'checkout_abandoners',
                        'high_engagement_users',
                        `${cancellationData.tourId.replace('-', '_')}_tour_interest`
                    ];

                    audiencesToRemove.forEach(audienceId => {
                        try {
                            remarketingManager.removeUserFromAudience(userId, audienceId);
                        } catch (error) {
                            console.warn(`Failed to remove user from audience ${audienceId}:`, error);
                        }
                    });

                    // Add to cancelled customers exclusion audience
                    remarketingManager.addUserToAudience(userId, 'cancelled_customers', {
                        ...cancellationData,
                        exclusionReason: 'booking_cancelled'
                    });

                    // Track tour-specific cancellation for enhanced segmentation
                    trackCustomGoogleAdsConversion('tour_cancellation', {
                        value: cancellationData.refundAmount,
                        currency: 'JPY',
                        tour_category: cancellationData.tourId,
                        tour_location: 'kyoto',
                        cancellation_source: 'website',
                        customer_segment: 'cancelled_customer'
                    });

                    console.log('🎯 Booking cancellation tracked and remarketing audiences updated:', cancellationData);
                } catch (error) {
                    console.warn('Failed to track booking cancellation:', error);
                }

                if (result.refund) {
                    setMessage(`Booking cancelled successfully. Refund of ¥${result.refund.amount.toLocaleString('en-US')} will be processed.`);
                } else {
                    setMessage(`Booking cancelled successfully. If you paid for this booking, please contact us to process your refund.`);
                }
                // Remove cancelled booking from list
                setBookings(prev => prev.filter(b => b.id !== booking.id));
            } else {
                console.error('Error from server:', result.error);
                setMessage(result.error || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            setMessage('Failed to cancel booking: ' + (error.message || 'An error occurred'));
        } finally {
            setCancelling(prev => ({ ...prev, [booking.id]: false }));
        }
    };

    function getBookingDateTime(booking) {
        const timeFormatted = booking.booking_time.padStart(5, '0');
        return new Date(`${booking.booking_date}T${timeFormatted}`);
    }

    const now = new Date();
    const futureBookings = bookings
        .filter(booking => getBookingDateTime(booking) > now && booking.status !== 'CANCELLED' && booking.status !== 'REFUNDED')
        .sort((a, b) => {
            const dateA = getBookingDateTime(a);
            const dateB = getBookingDateTime(b);
            return dateB.getTime() - dateA.getTime(); // Most recent first
        });

    return (
        <div className='min-h-screen bg-gray-50 flex flex-col'>
            <Header />

            {/* Hero Section */}
            <div className="bg-white">
                <div className="max-w-4xl mx-auto px-6 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Cancel Your Booking
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We understand plans can change. Cancel your tour booking quickly and easily below.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-12">
                <div className="max-w-4xl mx-auto px-6">

                    {/* Email Lookup Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Find Your Booking</h2>
                            <p className="text-gray-600">Enter the email address you used when making your booking</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && email.trim() && !loading) {
                                            handleLookupBookings();
                                        }
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <button
                                onClick={handleLookupBookings}
                                disabled={loading || !email.trim()}
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Searching...
                                    </div>
                                ) : (
                                    'Find My Bookings'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`rounded-xl p-4 mb-8 ${message.includes('successfully')
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {message.includes('successfully') ? (
                                        <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium">{message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bookings List */}
                    {futureBookings.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Upcoming Bookings</h2>

                            {!tours ? (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                    <div className="flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                                        <p className="text-gray-600">Loading booking details...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {futureBookings.map((booking) => {
                                        const bookingDateTime = getBookingDateTime(booking);
                                        const canCancel = (bookingDateTime - now) > (24 * 60 * 60 * 1000);
                                        const tourName = getTourName(booking.tour_type);
                                        const refundAmount = calculateRefundAmount(booking);

                                        return (
                                            <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
                                                {/* Tour Header */}
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
                                                    <Link to={getTourUrl(booking.tour_type)}>
                                                        <h3 className="text-xl font-semibold text-blue-900 hover:text-blue-700 transition-colors">
                                                            {tourName}
                                                        </h3>
                                                    </Link>
                                                </div>

                                                {/* Booking Details */}
                                                <div className="p-8">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500 mb-1">Lead Traveler</p>
                                                                <p className="text-lg text-gray-900">{booking.customer_name || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500 mb-1">Tour Date & Time</p>
                                                                <p className="text-lg text-gray-900">
                                                                    {new Date(booking.booking_date).toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    })}
                                                                </p>
                                                                <p className="text-lg text-gray-900">{booking.booking_time}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500 mb-1">Participants</p>
                                                                <p className="text-lg text-gray-900">
                                                                    {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                                                                    {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="lg:text-right">
                                                            <div className="bg-gray-50 rounded-xl p-6">
                                                                <p className="text-sm font-medium text-gray-500 mb-2">Refund Amount</p>
                                                                <p className="text-3xl font-bold text-green-600">
                                                                    ¥{refundAmount.toLocaleString('en-US')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Section */}
                                                    <div className="pt-6 border-t border-gray-100">
                                                        {canCancel ? (
                                                            <button
                                                                onClick={() => handleCancelBooking(booking)}
                                                                disabled={cancelling[booking.id]}
                                                                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                            >
                                                                {cancelling[booking.id] ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                        Cancelling...
                                                                    </div>
                                                                ) : (
                                                                    'Cancel This Booking'
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                                                <div className="flex items-start">
                                                                    <svg className="w-5 h-5 text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                    </svg>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-amber-800">Cannot Cancel</p>
                                                                        <p className="text-sm text-amber-700 mt-1">
                                                                            Cancellations must be made at least 24 hours before the tour time.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default BookingCancellation; 