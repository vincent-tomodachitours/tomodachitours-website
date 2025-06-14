import React, { useState, useEffect } from 'react';
import Header from './Headers/Header1';
import Footer from './Footer';
import { supabase } from '../lib/supabase';
import { fetchTours } from '../services/toursService';
import { Link } from 'react-router-dom';

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
            'GION_TOUR': 'gion-tour'
        }[tourType];

        return tours[tourKey]?.['tour-title'] || tourType;
    };

    // Helper function to calculate refund amount
    const calculateRefundAmount = (booking) => {
        if (!tours) return 0;

        const tourKey = {
            'NIGHT_TOUR': 'night-tour',
            'MORNING_TOUR': 'morning-tour',
            'UJI_TOUR': 'uji-tour',
            'GION_TOUR': 'gion-tour'
        }[booking.tour_type];

        const tourPrice = tours[tourKey]?.['tour-price'] || 0;
        const totalParticipants = (booking.adults || 0) + (booking.children || 0);

        return tourPrice * totalParticipants;
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
        <div className='w-full h-screen min-h-screen flex flex-col overflow-y-auto bg-stone-300'>
            <Header />
            <div className="w-4/5 md:w-3/4 mx-auto flex-1 mt-10">
                <h1 className="font-roboto text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-12 text-gray-700">Cancel Your Booking</h1>

                <div className="mb-6 bg-white p-6 rounded-lg border border-gray-300">
                    <label className="block font-ubuntu text-lg font-medium mb-4 text-gray-700">
                        Email Address (used for booking)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 h-10 px-3 py-2 border border-gray-300 rounded-md font-ubuntu"
                            placeholder="Enter your email"
                        />
                        <button
                            onClick={handleLookupBookings}
                            disabled={loading}
                            className="group relative inline-flex items-center justify-center w-full sm:w-auto px-8 py-2 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-xl"></span>
                            <span className="relative flex items-center">
                                {loading ? 'Looking up...' : (
                                    <>
                                        Find Bookings
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-md mb-4 font-ubuntu ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message}
                    </div>
                )}

                {futureBookings.length > 0 && (
                    <div>
                        <h2 className="font-roboto text-2xl font-bold mb-6 text-gray-700">Your Bookings</h2>
                        {!tours ? (
                            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                                <p className="text-gray-600 font-ubuntu">Loading booking details...</p>
                            </div>
                        ) : (
                            futureBookings.map((booking) => {
                                const bookingDateTime = getBookingDateTime(booking);
                                const canCancel = (bookingDateTime - now) > (24 * 60 * 60 * 1000);
                                const tourName = getTourName(booking.tour_type);
                                const refundAmount = calculateRefundAmount(booking);

                                return (
                                    <div key={booking.id} className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                                        <Link to={getTourUrl(booking.tour_type)}>
                                            <h3 className="font-roboto text-xl font-bold text-blue-600 mb-3 hover:text-blue-800 transition-colors">{tourName}</h3>
                                        </Link>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-gray-700 font-ubuntu mb-2">
                                                    <strong>Lead Traveler:</strong> {booking.customer_name || 'N/A'}
                                                </p>
                                                <p className="text-gray-700 font-ubuntu mb-2">
                                                    <strong>Date:</strong> {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                                                </p>
                                                <p className="text-gray-700 font-ubuntu">
                                                    <strong>Participants:</strong> {booking.adults} adults, {booking.children} children
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <p className="text-gray-700 font-ubuntu">
                                                    <strong>Refund Amount:</strong> <span className="text-green-600 font-bold text-xl ml-2">¥{refundAmount.toLocaleString('en-US')}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            {canCancel ? (
                                                <button
                                                    onClick={() => handleCancelBooking(booking)}
                                                    disabled={cancelling[booking.id]}
                                                    className="px-6 py-3 bg-red-600 text-white rounded-md font-roboto font-bold disabled:bg-gray-400 hover:bg-red-700 transition-colors"
                                                >
                                                    {cancelling[booking.id] ? 'Cancelling...' : 'Cancel Booking'}
                                                </button>
                                            ) : (
                                                <p className="text-red-600 font-ubuntu font-bold">
                                                    Cannot cancel - less than 24 hours before tour
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default BookingCancellation; 