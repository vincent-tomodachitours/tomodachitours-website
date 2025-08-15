import React, { useEffect } from 'react'
import Header1 from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { ReactComponent as CheckCircle } from '../SVG/check-circle.svg'
import { ReactComponent as Instagram } from '../SVG/instagram.svg'
import { ReactComponent as Whatsapp } from '../SVG/whatsapp.svg'
import { Link } from 'react-router-dom'
import { trackPurchase } from '../services/analytics'
import { trackCustomGoogleAdsConversion } from '../services/googleAdsTracker'
import attributionService from '../services/attributionService'
import remarketingManager from '../services/remarketingManager'
import dynamicRemarketingService from '../services/dynamicRemarketingService'

const Thankyou = () => {
    useEffect(() => {
        // Track comprehensive purchase conversion when thank you page loads
        // Get booking data from URL params or sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        const bookingData = {
            transactionId: urlParams.get('transaction_id') || sessionStorage.getItem('booking_transaction_id') || `booking_${Date.now()}`,
            tourName: urlParams.get('tour_name') || sessionStorage.getItem('booking_tour_name') || 'Tour Booking',
            tourId: urlParams.get('tour_id') || sessionStorage.getItem('booking_tour_id') || 'unknown',
            value: parseFloat(urlParams.get('value')) || parseFloat(sessionStorage.getItem('booking_value')) || 0,
            price: parseFloat(urlParams.get('price')) || parseFloat(sessionStorage.getItem('booking_price')) || 0,
            quantity: parseInt(urlParams.get('quantity')) || parseInt(sessionStorage.getItem('booking_quantity')) || 1
        };

        // Get additional booking data from session storage
        const additionalData = {
            adults: parseInt(sessionStorage.getItem('booking_adults')) || 0,
            children: parseInt(sessionStorage.getItem('booking_children')) || 0,
            infants: parseInt(sessionStorage.getItem('booking_infants')) || 0,
            originalPrice: parseFloat(sessionStorage.getItem('booking_original_price')) || bookingData.value,
            discountApplied: sessionStorage.getItem('booking_discount_applied') === 'true',
            discountAmount: parseFloat(sessionStorage.getItem('booking_discount_amount')) || 0,
            discountCode: sessionStorage.getItem('booking_discount_code'),
            paymentProvider: sessionStorage.getItem('booking_payment_provider') || 'stripe',
            bookingDate: sessionStorage.getItem('booking_date'),
            bookingTime: sessionStorage.getItem('booking_time'),
            customerEmail: sessionStorage.getItem('booking_customer_email'),
            customerName: sessionStorage.getItem('booking_customer_name')
        };

        // Combine all booking data
        const completeBookingData = {
            ...bookingData,
            ...additionalData,
            currency: 'JPY',
            // Get attribution data for enhanced conversions
            attribution: attributionService.getAttributionForAnalytics()
        };

        // Only track if we have meaningful data
        if (bookingData.value > 0 || bookingData.price > 0) {
            // Track with existing analytics service (includes GA4 and Google Ads)
            trackPurchase(completeBookingData);

            // Track additional Google Ads conversion events for remarketing
            try {
                // Track purchase completion conversion
                trackCustomGoogleAdsConversion('purchase_completion', {
                    value: completeBookingData.value,
                    currency: 'JPY',
                    transaction_id: completeBookingData.transactionId,
                    tour_id: completeBookingData.tourId,
                    tour_name: completeBookingData.tourName,
                    conversion_page: 'thank_you',
                    customer_lifetime_value: completeBookingData.value, // First purchase
                    new_customer: true
                });

                // Track tour-specific purchase completion for enhanced segmentation
                if (completeBookingData.tourId && completeBookingData.tourId !== 'unknown') {
                    trackCustomGoogleAdsConversion('tour_purchase_completion', {
                        value: completeBookingData.value,
                        currency: 'JPY',
                        transaction_id: completeBookingData.transactionId,
                        tour_category: completeBookingData.tourId,
                        tour_location: 'kyoto',
                        booking_source: completeBookingData.attribution?.source || 'direct'
                    });
                }

                console.log('🎯 Enhanced Google Ads conversions tracked');
            } catch (error) {
                console.warn('Additional Google Ads conversion tracking failed:', error);
            }

            // Process purchase completion for remarketing audience management
            try {
                remarketingManager.processPurchaseCompletion(completeBookingData);
                console.log('🎯 Remarketing audience exclusion processed');
            } catch (error) {
                console.warn('Remarketing audience processing failed:', error);
            }

            // Add dynamic remarketing parameters for post-purchase remarketing
            try {
                dynamicRemarketingService.addDynamicRemarketingParameters({
                    ...completeBookingData,
                    eventType: 'purchase_completion',
                    customerStatus: 'converted',
                    conversionValue: completeBookingData.value
                });
                console.log('🎯 Dynamic remarketing parameters added');
            } catch (error) {
                console.warn('Dynamic remarketing parameter addition failed:', error);
            }

            console.log('🎯 Comprehensive purchase conversion tracked:', completeBookingData);
        } else {
            // Fallback tracking with estimated values
            const fallbackData = {
                transactionId: `fallback_${Date.now()}`,
                tourName: 'Kyoto Tour Booking',
                tourId: 'tour-booking',
                value: 7000, // Average tour price
                price: 7000,
                quantity: 1,
                currency: 'JPY',
                attribution: attributionService.getAttributionForAnalytics()
            };

            trackPurchase(fallbackData);

            // Track fallback Google Ads conversion
            try {
                trackCustomGoogleAdsConversion('purchase_completion', {
                    value: fallbackData.value,
                    currency: 'JPY',
                    transaction_id: fallbackData.transactionId,
                    conversion_page: 'thank_you',
                    fallback_tracking: true
                });
            } catch (error) {
                console.warn('Fallback Google Ads conversion tracking failed:', error);
            }

            console.log('🎯 Fallback purchase conversion tracked');
        }

        // Track thank you page view for remarketing
        try {
            trackCustomGoogleAdsConversion('thank_you_page_view', {
                page_title: 'Booking Confirmed',
                page_location: window.location.href,
                conversion_page: 'thank_you',
                customer_status: 'converted'
            });
        } catch (error) {
            console.warn('Thank you page view tracking failed:', error);
        }

        // Clean up session storage after tracking
        const sessionKeys = [
            'booking_transaction_id',
            'booking_tour_name',
            'booking_tour_id',
            'booking_value',
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
            'booking_customer_name',
            'checkout_data'
        ];

        sessionKeys.forEach(key => {
            try {
                sessionStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove session storage key: ${key}`, error);
            }
        });
    }, []);

    return (
        <div className='min-h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50 to-white'>
            <Header1 />

            <main className='flex-grow flex items-center justify-center px-4 py-12'>
                <div className='max-w-3xl mx-auto flex flex-col items-center text-center'>
                    {/* Success Animation Container */}
                    <div className='mb-8 relative'>
                        <div className='absolute -inset-4 bg-emerald-100 rounded-full animate-pulse'></div>
                        <CheckCircle className='w-24 h-24 md:w-28 md:h-28 text-emerald-500 relative' />
                    </div>

                    {/* Main Content */}
                    <div className='space-y-6 mb-12'>
                        <div className='space-y-3'>
                            <h1 className='text-3xl md:text-4xl font-bold text-gray-900 font-roboto'>
                                Booking Confirmed!
                            </h1>
                            <p className='text-xl text-emerald-600 font-medium'>
                                Thank you for choosing Tomodachi Tours
                            </p>
                        </div>

                        <div className='bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto'>
                            <div className='space-y-4 text-left'>
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
                            Need to cancel your booking?
                            <Link to="/cancel-booking" className="text-blue-600 hover:text-blue-700 ml-2 underline font-medium">
                                Cancel here
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Thankyou