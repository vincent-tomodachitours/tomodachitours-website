import React, { useState } from 'react';
import Header from './Headers/Header1';
import Footer from './Footer';

const BookingCancellation = () => {
    const [email, setEmail] = useState('');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [message, setMessage] = useState('');

    const handleLookupBookings = async () => {
        if (!email.trim()) return;
        
        setLoading(true);
        setMessage('');
        
        try {
            const response = await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/getBookingDetails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();
            
            if (result.success) {
                setBookings(result.bookings);
                if (result.bookings.length === 0) {
                    setMessage('No bookings found for this email address');
                }
            } else {
                setMessage('Failed to lookup bookings');
            }
        } catch (error) {
            setMessage('Failed to lookup bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (booking) => {
        if (!window.confirm(`Are you sure you want to cancel your booking for ${booking.tourName} on ${booking.date}?`)) {
            return;
        }

        setCancelling(true);
        
        try {
            const response = await fetch("https://us-central1-tomodachitours-f4612.cloudfunctions.net/cancelBooking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: booking.id,
                    chargeId: booking.chargeId,
                    email: email
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                setMessage(`Booking cancelled successfully. Refund of ¥${result.refund.amount.toLocaleString('en-US')} will be processed.`);
                // Remove cancelled booking from list
                setBookings(prev => prev.filter(b => b.id !== booking.id));
            } else {
                setMessage(result.message || 'Failed to cancel booking');
            }
        } catch (error) {
            setMessage('Failed to cancel booking');
        } finally {
            setCancelling(false);
        }
    };

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
                    <div className={`p-4 rounded-md mb-4 font-ubuntu ${
                        message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {bookings.length > 0 && (
                    <div>
                        <h2 className="font-roboto text-2xl font-bold mb-6 text-gray-700">Your Bookings</h2>
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                                <h3 className="font-roboto text-xl font-bold text-blue-600 mb-2">{booking.tourName}</h3>
                                <p className="text-gray-700 font-ubuntu mb-2">
                                    <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()} at {booking.time}
                                </p>
                                <p className="text-gray-700 font-ubuntu mb-4">
                                    <strong>Participants:</strong> {booking.adults} adults, {booking.children} children
                                </p>
                                <div className="mt-3">
                                    {booking.canCancel ? (
                                        <button
                                            onClick={() => handleCancelBooking(booking)}
                                            disabled={cancelling}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md font-roboto font-bold disabled:bg-gray-400 hover:bg-red-700"
                                        >
                                            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                                        </button>
                                    ) : (
                                        <p className="text-red-600 font-ubuntu font-bold">
                                            Cannot cancel - less than 24 hours before tour
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default BookingCancellation; 