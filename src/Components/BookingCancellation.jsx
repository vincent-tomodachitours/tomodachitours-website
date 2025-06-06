import React, { useState, useEffect } from 'react';
import Header from './Headers/Header1';
import Footer from './Footer';
import { supabase } from '../lib/supabase';
import { fetchTours } from '../services/toursService';

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
                console.error('Failed to load tours data:', error);
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

    const handleLookupBookings = async () => {
        if (!email.trim()) return;

        setLoading(true);
        setMessage('');

        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .ilike('customer_email', email); // case-insensitive

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

        try {
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
                setMessage(result.error || 'Failed to cancel booking');
            }
        } catch (error) {
            setMessage('Failed to cancel booking: ' + (error.message || JSON.stringify(error)));
            console.error('Cancel booking error:', error);
        } finally {
            setCancelling(prev => ({ ...prev, [booking.id]: false }));
        }
    };

    function getBookingDateTime(booking) {
        // booking_date: 'YYYY-MM-DD', booking_time: 'H:MM' or 'HH:MM'
        // Ensure time format has leading zero for proper parsing
        const timeFormatted = booking.booking_time.padStart(5, '0');
        return new Date(`${booking.booking_date}T${timeFormatted}`);
    }

    const now = new Date();
    const futureBookings = bookings.filter(
        booking => getBookingDateTime(booking) > now && booking.status !== 'CANCELLED'
    );

    return (
        <div className='w-full h-screen min-h-screen flex flex-col overflow-y-auto bg-stone-300'>
            <Header />
            <div className="w-4/5 md:w-3/4 mx-auto flex-1 mt-10">
                <h1 className="font-roboto text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-12 text-gray-700">Cancel Your Booking</h1>

                <div className="mb-6 bg-white p-6 rounded-lg border border-gray-300">
                    <label className="block font-ubuntu text-lg font-medium mb-4 text-gray-700">
                        Email Address (used for booking)
                    </label>
                    <div className="flex gap-2">
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
                            className="px-4 py-2 bg-blue-600 text-white rounded-md font-roboto font-bold disabled:bg-gray-400"
                        >
                            {loading ? 'Looking up...' : 'Find Bookings'}
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
                                        <h3 className="font-roboto text-xl font-bold text-blue-600 mb-3">{tourName}</h3>

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