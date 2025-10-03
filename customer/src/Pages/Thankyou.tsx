import React, { useEffect, useState } from 'react'
import Header1 from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'
import { ReactComponent as CheckCircle } from '../SVG/check-circle.svg'
import { ReactComponent as InfoCircle } from '../SVG/info-circle.svg'
import { ReactComponent as Instagram } from '../SVG/instagram.svg'
import { ReactComponent as Whatsapp } from '../SVG/whatsapp.svg'
import { Link } from 'react-router-dom'
import gtmService from '../services/gtmService'

const Thankyou: React.FC = () => {
    const [isBookingRequest, setIsBookingRequest] = useState(false);
    const [requestData, setRequestData] = useState<any>(null);

    useEffect(() => {
        // Check if this is a booking request
        const bookingRequestSubmitted = sessionStorage.getItem('booking_request_submitted');
        const bookingRequestDataStr = sessionStorage.getItem('booking_request_data');
        
        if (bookingRequestSubmitted === 'true' && bookingRequestDataStr) {
            try {
                const data = JSON.parse(bookingRequestDataStr);
                setIsBookingRequest(true);
                setRequestData(data);
                
                // Clean up session storage for booking requests
                setTimeout(() => {
                    sessionStorage.removeItem('booking_request_submitted');
                    sessionStorage.removeItem('booking_request_data');
                }, 2000);
                
                return; // Don't run the purchase tracking for booking requests
            } catch (error) {
                console.warn('Failed to parse booking request data:', error);
            }
        }
    }, []);

    useEffect(() => {
        // Only run purchase tracking for confirmed bookings, not requests
        if (isBookingRequest) {
            return;
        }
        const trackPurchaseConversion = async () => {
            // Get transaction data from sessionStorage (set during payment) - moved outside try block for catch block access
            const transactionId = sessionStorage.getItem('booking_transaction_id') || `txn_${Date.now()}`;

            // Safely parse booking value with better error handling
            const bookingValueStr = sessionStorage.getItem('booking_value');
            let value = 7000; // Default fallback
            if (bookingValueStr && bookingValueStr !== 'undefined' && bookingValueStr !== 'null') {
                const parsedValue = parseFloat(bookingValueStr);
                if (!isNaN(parsedValue) && parsedValue > 0) {
                    value = parsedValue;
                }
            }

            const tourId = sessionStorage.getItem('booking_tour_id') || 'tour-booking';
            const tourName = sessionStorage.getItem('booking_tour_name') || 'Kyoto Tour';
            const customerEmail = sessionStorage.getItem('booking_customer_email') || '';
            const customerPhone = sessionStorage.getItem('booking_customer_phone') || '';

            try {
                console.log('🎯 Starting purchase conversion tracking on thank you page');

                // Validate required data before proceeding
                if (!transactionId || !value || !tourId) {
                    console.error('❌ Critical purchase data missing:', { transactionId, value, tourId });
                    throw new Error('Missing required purchase data');
                }

                // Prepare transaction data for GTM with consistent values
                const purchaseData = {
                    transaction_id: transactionId,
                    transactionId: transactionId, // Support both formats
                    value: value,
                    currency: 'JPY',
                    tour_id: tourId,
                    tour_name: tourName,
                    booking_date: sessionStorage.getItem('booking_date') || new Date().toISOString().split('T')[0],
                    payment_provider: sessionStorage.getItem('booking_payment_provider') || 'stripe',
                    quantity: 1, // Add explicit quantity
                    items: [{
                        item_id: tourId,
                        item_name: tourName,
                        item_category: 'tour',
                        price: value, // Use same value as ecommerce.value
                        quantity: 1
                    }]
                };

                // Prepare customer data for enhanced conversions (if available)
                let customerData = null;
                if (customerEmail) {
                    // Hash customer data for enhanced conversions
                    const hashCustomerData = async (data: string) => {
                        try {
                            const encoder = new TextEncoder();
                            const dataBuffer = encoder.encode(data.toLowerCase().trim());
                            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                            const hashArray = Array.from(new Uint8Array(hashBuffer));
                            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                        } catch (error) {
                            console.warn('Failed to hash customer data:', error);
                            return null;
                        }
                    };

                    customerData = {
                        email_hash: await hashCustomerData(customerEmail),
                        phone_hash: customerPhone ? await hashCustomerData(customerPhone) : null
                    };
                }

                console.log('📊 Purchase data prepared:', { transactionId, value, tourId, tourName });

                // Check if purchase has already been tracked to prevent duplicates
                const purchaseTracked = sessionStorage.getItem('purchase_tracked');
                if (purchaseTracked === 'true') {
                    console.log('🚫 Purchase already tracked, skipping duplicate');
                    return;
                }

                // Set tracking flag immediately to prevent race conditions
                sessionStorage.setItem('purchase_tracked', 'processing');

                // Enable debug mode for purchase tracking
                gtmService.enableDebugMode(true);

                // Log dataLayer before tracking
                console.log('📋 DataLayer before purchase tracking:', window.dataLayer?.slice(-5));

                // Track purchase conversion via GTM service (this handles the Google Ads conversion)
                const gtmSuccess = gtmService.trackPurchaseConversion(purchaseData, customerData || undefined);

                // Log dataLayer after tracking
                setTimeout(() => {
                    console.log('📋 DataLayer after purchase tracking:', window.dataLayer?.slice(-5));

                    // Check for standard purchase events
                    const purchaseEvents = window.dataLayer?.filter(event => event.event === 'purchase') || [];
                    console.log('🔍 Standard purchase events found in dataLayer:', purchaseEvents.length);

                    if (purchaseEvents.length === 0) {
                        console.warn('⚠️ No purchase events found in dataLayer!');
                    } else {
                        console.log('✅ Standard purchase event(s) found:', purchaseEvents.length);
                        console.log('ℹ️ GTM will forward this to both GA4 and Google Ads');

                        // Show the structure of the latest purchase event
                        const latestPurchase = purchaseEvents[purchaseEvents.length - 1];
                        console.log('📊 Latest purchase event structure:', {
                            event: latestPurchase.event,
                            transaction_id: latestPurchase.ecommerce?.transaction_id,
                            value: latestPurchase.ecommerce?.value,
                            currency: latestPurchase.ecommerce?.currency,
                            items_count: latestPurchase.ecommerce?.items?.length,
                            tour_id: latestPurchase.tour_id
                        });
                    }
                }, 1000);

                if (gtmSuccess) {
                    console.log('✅ GTM purchase conversion tracked successfully');
                    console.log('📊 Purchase data sent:', purchaseData);
                    console.log('👤 Customer data sent:', customerData);
                    // Mark as successfully tracked
                    sessionStorage.setItem('purchase_tracked', 'true');
                } else {
                    console.warn('⚠️ GTM purchase conversion tracking failed');
                    console.log('📊 Failed purchase data:', purchaseData);
                    // Reset tracking flag so it can be retried
                    sessionStorage.setItem('purchase_tracked', 'failed');
                }

                // Clean up session storage after successful tracking
                setTimeout(() => {
                    try {
                        const keysToRemove = [
                            'booking_transaction_id',
                            'booking_value',
                            'booking_tour_id',
                            'booking_tour_name',
                            'booking_price',
                            'booking_quantity',
                            'booking_adults',
                            'booking_children',
                            'booking_infants',
                            'booking_original_price',
                            'booking_discount_applied',
                            'booking_discount_amount',
                            'booking_discount_code',
                            'booking_payment_provider',
                            'booking_date',
                            'booking_time',
                            'booking_customer_email',
                            'booking_customer_phone',
                            'booking_customer_name',
                            'payment_completed',
                            'payment_completion_time',
                            'purchase_tracked'
                        ];

                        keysToRemove.forEach(key => {
                            sessionStorage.removeItem(key);
                        });

                        console.log('🧹 Session storage cleaned up');
                    } catch (error) {
                        console.warn('Failed to clean up session storage:', error);
                    }
                }, 2000); // Wait 2 seconds before cleanup to ensure tracking completes

            } catch (error) {
                console.error('❌ Error in purchase conversion tracking:', error);

                // Reset tracking flag on error so it can be retried
                sessionStorage.setItem('purchase_tracked', 'error');

                // Fallback: Push a basic purchase event with available data
                try {
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        event: 'purchase',
                        ecommerce: {
                            transaction_id: transactionId || `fallback_${Date.now()}`,
                            value: value || 7000,
                            currency: 'JPY',
                            items: [{
                                item_id: tourId || 'tour-booking',
                                item_name: tourName || 'Kyoto Tour Booking',
                                item_category: 'tour',
                                price: value || 7000,
                                quantity: 1
                            }]
                        },
                        tour_id: tourId,
                        tour_name: tourName,
                        custom_parameters: {
                            conversion_page: 'thank_you',
                            fallback_tracking: true,
                            error_message: error instanceof Error ? error.message : 'Unknown error'
                        }
                    });
                    console.log('🔄 Fallback purchase tracking completed');
                } catch (fallbackError) {
                    console.error('❌ Fallback tracking also failed:', fallbackError);
                }
            }
        };

        // Execute purchase conversion tracking after a short delay to ensure page is fully loaded
        const timer = setTimeout(trackPurchaseConversion, 500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className='min-h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50 to-white'>
            <SEO
                title={seoData.thankyou.title}
                description={seoData.thankyou.description}
                keywords={seoData.thankyou.keywords}
            />
            <Header1 />

            <main className='flex-grow flex items-center justify-center px-4 py-12'>
                <div className='max-w-3xl mx-auto flex flex-col items-center text-center'>
                    {/* Success Animation Container */}
                    <div className='mb-8 relative'>
                        {isBookingRequest ? (
                            <>
                                <div className='absolute -inset-4 bg-blue-100 rounded-full animate-pulse'></div>
                                <InfoCircle className='w-24 h-24 md:w-28 md:h-28 text-blue-500 relative' />
                            </>
                        ) : (
                            <>
                                <div className='absolute -inset-4 bg-emerald-100 rounded-full animate-pulse'></div>
                                <CheckCircle className='w-24 h-24 md:w-28 md:h-28 text-emerald-500 relative' />
                            </>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className='space-y-6 mb-12'>
                        <div className='space-y-3'>
                            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 font-roboto'>
                                {isBookingRequest ? 'Request Submitted!' : 'Booking Confirmed!'}
                            </h1>
                            <p className={`text-xl font-medium ${isBookingRequest ? 'text-blue-600' : 'text-emerald-600'}`}>
                                Thank you for choosing Tomodachi Tours
                            </p>
                        </div>

                        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto'>
                            <div className='space-y-4 text-left'>
                                {isBookingRequest ? (
                                    <>
                                        <div className='border-b border-gray-100 pb-4'>
                                            <h2 className='text-lg font-semibold text-gray-800 mb-2'>What Happens Next</h2>
                                            <p className='text-gray-600'>Your booking request is being reviewed by our team</p>
                                        </div>
                                        {requestData && (
                                            <div className='bg-blue-50 rounded-lg p-4 mb-4'>
                                                <h3 className='font-semibold text-blue-900 mb-2'>Request Details</h3>
                                                <div className='text-sm text-blue-800 space-y-1'>
                                                    <p><strong>Tour:</strong> {requestData.tourName}</p>
                                                    <p><strong>Date:</strong> {requestData.bookingDate}</p>
                                                    <p><strong>Time:</strong> {requestData.bookingTime}</p>
                                                    <p><strong>Participants:</strong> {requestData.adults} adults{requestData.children > 0 && `, ${requestData.children} children`}{requestData.infants > 0 && `, ${requestData.infants} infants`}</p>
                                                    <p><strong>Total Amount:</strong> ¥{requestData.totalAmount?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className='space-y-3 pt-2'>
                                            <p className='text-gray-600 flex items-start'>
                                                <span className='text-blue-500 mr-2'>•</span>
                                                We'll review your request and confirm availability within 24 hours
                                            </p>
                                            <p className='text-gray-600 flex items-start'>
                                                <span className='text-blue-500 mr-2'>•</span>
                                                You'll receive an email notification once your booking is approved or if we need more information
                                            </p>
                                            <p className='text-gray-600 flex items-start'>
                                                <span className='text-blue-500 mr-2'>•</span>
                                                Your payment method is securely stored but won't be charged until your booking is confirmed
                                            </p>
                                            <div className='flex items-start'>
                                                <span className='text-blue-500 mr-2'>•</span>
                                                <p className='text-gray-600'>
                                                    Questions? Contact us at{' '}
                                                    <a href="mailto:contact@tomodachitours.com" className='text-blue-600 hover:text-blue-700'>
                                                        contact@tomodachitours.com
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='border-b border-gray-100 pb-4'>
                                            <h2 className='text-lg font-semibold text-gray-800 mb-2'>Next Steps</h2>
                                            <p className='text-gray-600'>We've sent a confirmation email with your booking details</p>
                                        </div>
                                        <div className='space-y-3 pt-2'>
                                            <p className='text-gray-600 flex items-start'>
                                                <span className='text-emerald-500 mr-2'>•</span>
                                                Your tour guide will contact you via WhatsApp approximately 48 hours before your tour
                                            </p>
                                            <div className='flex items-start'>
                                                <span className='text-emerald-500 mr-2'>•</span>
                                                <p className='text-gray-600'>
                                                    If you don't receive the confirmation email within 24 hours, contact us at{' '}
                                                    <a href="mailto:contact@tomodachitours.com" className='text-blue-600 hover:text-blue-700'>
                                                        contact@tomodachitours.com
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Cards */}
                    <div className='w-full grid md:grid-cols-2 gap-6 mb-8'>
                        {/* Social Connect Card */}
                        <div className='group bg-gradient-to-br from-purple-500 to-pink-500 p-[3px] rounded-[12px] transition-transform hover:scale-[1.02] duration-300'>
                            <div className='bg-white p-6 rounded-[9px] h-full'>
                                <h3 className='text-xl font-semibold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text'>
                                    Stay Connected
                                </h3>
                                <p className='text-gray-600 mb-6'>Follow us for Japan travel tips and updates</p>
                                <div className='flex justify-center gap-8'>
                                    <a href="https://www.instagram.com/tomodachi_tours/"
                                        target='_blank'
                                        rel="noopener noreferrer"
                                        className='transform hover:scale-110 transition-transform duration-200'>
                                        <Instagram className='w-10 h-10 text-pink-500' />
                                    </a>
                                    <a href="https://wa.me/+8109059609701"
                                        target='_blank'
                                        rel="noopener noreferrer"
                                        className='transform hover:scale-110 transition-transform duration-200'>
                                        <Whatsapp className='w-10 h-10 text-green-500' />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Return to Website Card */}
                        <div className='group bg-gradient-to-br from-blue-500 to-cyan-500 p-[3px] rounded-[12px] transition-transform hover:scale-[1.02] duration-300'>
                            <div className='bg-white p-6 rounded-[9px] h-full flex flex-col justify-between'>
                                <div>
                                    <h3 className='text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text'>
                                        Explore More Tours
                                    </h3>
                                    <p className='text-gray-600 mb-6'>Discover our other amazing experiences in Japan</p>
                                </div>
                                <Link
                                    to="/"
                                    className='inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200'
                                >
                                    Visit Website
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Cancellation Link */}
                    <div className='bg-gray-50 px-6 py-3 rounded-xl'>
                        <p className="text-gray-600">
                            {isBookingRequest ? (
                                <>
                                    Need to modify or cancel your request?
                                    <a href="mailto:contact@tomodachitours.com" className="text-blue-600 hover:text-blue-700 ml-2 underline font-medium">
                                        Contact us
                                    </a>
                                </>
                            ) : (
                                <>
                                    Need to cancel your booking?
                                    <Link to="/cancel-booking" className="text-blue-600 hover:text-blue-700 ml-2 underline font-medium">
                                        Cancel here
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Thankyou