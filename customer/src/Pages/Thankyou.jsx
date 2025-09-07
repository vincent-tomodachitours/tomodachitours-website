import React, { useEffect } from 'react'
import Header1 from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'
import { ReactComponent as CheckCircle } from '../SVG/check-circle.svg'
import { ReactComponent as Instagram } from '../SVG/instagram.svg'
import { ReactComponent as Whatsapp } from '../SVG/whatsapp.svg'
import { Link } from 'react-router-dom'
import gtmService from '../services/gtmService'
import bookingFlowManager from '../services/bookingFlowManager'
import enhancedConversionService from '../services/enhancedConversionService'
import serverSideConversionTracker from '../services/serverSideConversionTracker'
import conversionValueOptimizer from '../services/conversionValueOptimizer'

const Thankyou = () => {
    useEffect(() => {
        const trackPurchaseConversion = async () => {
            try {
                // Get booking data from URL params (primary source) or fallback to sessionStorage
                const urlParams = new URLSearchParams(window.location.search);

                // Extract transaction data from URL or sessionStorage
                const transactionData = {
                    transactionId: urlParams.get('transaction_id') || sessionStorage.getItem('booking_transaction_id') || `txn_${Date.now()}`,
                    value: parseFloat(urlParams.get('value')) || parseFloat(sessionStorage.getItem('booking_value')) || 0,
                    currency: 'JPY'
                };

                // Extract tour data
                const tourData = {
                    tourId: urlParams.get('tour_id') || sessionStorage.getItem('booking_tour_id') || 'unknown',
                    tourName: urlParams.get('tour_name') || sessionStorage.getItem('booking_tour_name') || 'Tour Booking',
                    price: parseFloat(urlParams.get('price')) || parseFloat(sessionStorage.getItem('booking_price')) || transactionData.value,
                    date: sessionStorage.getItem('booking_date') || '',
                    time: sessionStorage.getItem('booking_time') || '',
                    location: 'kyoto',
                    category: 'tour'
                };

                // Extract customer data for enhanced conversions
                const customerData = {
                    email: sessionStorage.getItem('booking_customer_email') || '',
                    phone: sessionStorage.getItem('booking_customer_phone') || '',
                    name: sessionStorage.getItem('booking_customer_name') || '',
                    firstName: sessionStorage.getItem('booking_customer_first_name') || '',
                    lastName: sessionStorage.getItem('booking_customer_last_name') || ''
                };

                // Extract payment data
                const paymentData = {
                    provider: sessionStorage.getItem('booking_payment_provider') || 'stripe',
                    amount: transactionData.value,
                    currency: transactionData.currency
                };

                // Check if we have valid booking data
                if (transactionData.value <= 0 && tourData.price <= 0) {
                    console.warn('No valid transaction value found, using fallback tracking');

                    // Use fallback values for tracking
                    transactionData.value = 7000; // Average tour price
                    tourData.price = 7000;
                    paymentData.amount = 7000;
                }

                console.log('🎯 Processing purchase conversion with GTM-based tracking');

                // Initialize or get current booking state from booking flow manager
                let bookingState = bookingFlowManager.getCurrentBookingState();

                if (!bookingState) {
                    // Initialize booking if not already done
                    bookingFlowManager.initializeBooking(tourData);
                    bookingState = bookingFlowManager.getCurrentBookingState();
                }

                // Extract discount information if available
                const discountData = {
                    type: sessionStorage.getItem('booking_discount_type'),
                    value: parseFloat(sessionStorage.getItem('booking_discount_value')) || 0,
                    code: sessionStorage.getItem('booking_discount_code'),
                    originalAmount: parseFloat(sessionStorage.getItem('booking_original_amount')) || transactionData.value
                };

                // Prepare pricing context for conversion value optimization
                const pricingContext = {
                    basePrice: tourData.price,
                    quantity: 1,
                    originalPrice: discountData.originalAmount || transactionData.value,
                    discount: (discountData.type && discountData.value > 0) ? discountData : null,
                    campaign: sessionStorage.getItem('utm_campaign') || 'direct',
                    adGroup: sessionStorage.getItem('utm_adgroup') || 'unknown',
                    keyword: sessionStorage.getItem('utm_term') || 'unknown',
                    gclid: sessionStorage.getItem('gclid') || '',
                    options: {
                        pricingRules: [
                            { type: 'minimum', value: 1000 },
                            { type: 'round', value: 100 }
                        ]
                    }
                };

                // Track purchase conversion through booking flow manager with dynamic pricing
                const purchaseResult = bookingFlowManager.trackPurchase({
                    transactionId: transactionData.transactionId,
                    finalAmount: transactionData.value,
                    discount: pricingContext.discount,
                    originalAmount: pricingContext.originalPrice,
                    paymentProvider: paymentData.provider,
                    pricingRules: pricingContext.options.pricingRules
                });

                if (purchaseResult.success) {
                    console.log('✅ Purchase conversion tracked through booking flow manager');

                    // Prepare enhanced conversion data
                    let enhancedConversionData = null;
                    if (customerData.email || customerData.phone || customerData.name) {
                        // Get user consent for enhanced conversions (assuming consent given on thank you page)
                        const consentData = {
                            analytics: 'granted',
                            ad_storage: 'granted'
                        };

                        enhancedConversionData = enhancedConversionService.prepareEnhancedConversion(
                            {
                                conversion_action: 'purchase',
                                conversion_value: transactionData.value,
                                currency: transactionData.currency,
                                order_id: transactionData.transactionId
                            },
                            customerData,
                            consentData
                        );
                    }

                    // Track GTM-based purchase conversion with enhanced data and pricing optimization
                    const gtmTrackingSuccess = gtmService.trackPurchaseConversion(
                        {
                            transaction_id: transactionData.transactionId,
                            value: transactionData.value,
                            currency: transactionData.currency,
                            originalPrice: pricingContext.originalPrice,
                            discount: pricingContext.discount,
                            items: [{
                                item_id: tourData.tourId,
                                item_name: tourData.tourName,
                                item_category: tourData.category,
                                price: tourData.price,
                                quantity: 1
                            }],
                            custom_parameters: {
                                tour_id: tourData.tourId,
                                tour_location: tourData.location,
                                booking_date: tourData.date,
                                booking_time: tourData.time,
                                payment_provider: paymentData.provider,
                                conversion_page: 'thank_you'
                            }
                        },
                        enhancedConversionData ? enhancedConversionData.enhanced_conversion_data : null,
                        pricingContext
                    );

                    // Generate revenue attribution report for this conversion
                    if (purchaseResult.pricingOptimization) {
                        const attributionResult = conversionValueOptimizer.trackRevenueAttribution(
                            {
                                conversionId: transactionData.transactionId,
                                campaign: pricingContext.campaign,
                                adGroup: pricingContext.adGroup,
                                keyword: pricingContext.keyword,
                                gclid: pricingContext.gclid,
                                productId: tourData.tourId,
                                productName: tourData.tourName,
                                productCategory: tourData.category,
                                conversionValue: transactionData.value,
                                isRepeatCustomer: sessionStorage.getItem('is_repeat_customer') === 'true'
                            },
                            purchaseResult.pricingOptimization
                        );

                        if (attributionResult.success) {
                            console.log('✅ Revenue attribution tracked:', attributionResult.attributionId);

                            // Store attribution ID for future reference
                            sessionStorage.setItem('attribution_id', attributionResult.attributionId);
                        } else {
                            console.warn('⚠️ Revenue attribution tracking failed:', attributionResult.error);
                        }
                    }

                    if (gtmTrackingSuccess) {
                        console.log('✅ GTM purchase conversion tracked successfully');
                    } else {
                        console.warn('⚠️ GTM purchase conversion tracking failed');
                    }

                    // Trigger server-side conversion validation
                    try {
                        const serverValidationSuccess = await serverSideConversionTracker.trackBookingConfirmation({
                            booking_id: transactionData.transactionId,
                            total_amount: transactionData.value,
                            currency: transactionData.currency,
                            tour_id: tourData.tourId,
                            tour_name: tourData.tourName,
                            tour_category: tourData.category,
                            quantity: 1,
                            customer_email: customerData.email,
                            customer_phone: customerData.phone,
                            customer_name: customerData.name,
                            booking_date: new Date().toISOString(),
                            tour_date: tourData.date
                        });

                        if (serverValidationSuccess) {
                            console.log('✅ Server-side conversion validation completed');
                        } else {
                            console.warn('⚠️ Server-side conversion validation failed');
                        }
                    } catch (error) {
                        console.error('❌ Server-side conversion validation error:', error);
                    }



                    // GTM-ONLY CONVERSION TRACKING FOR THANK YOU PAGE
                    // GTM will handle all Google Ads conversions through its tags
                    try {
                        console.log('🎯 Sending thank you page conversion data to GTM');

                        // Send conversion data to GTM dataLayer - GTM tags will handle Google Ads conversion
                        window.dataLayer.push({
                            event: 'thankyou_page_conversion',
                            ecommerce: {
                                transaction_id: transactionData.transactionId,
                                value: transactionData.value || 7000,
                                currency: 'JPY',
                                items: [{
                                    item_id: tourData.tourId,
                                    item_name: tourData.tourName,
                                    item_category: tourData.category,
                                    price: tourData.price,
                                    quantity: 1
                                }]
                            },
                            // Additional data for GTM to use in conversion tags
                            conversion_context: {
                                page_type: 'thank_you',
                                tour_id: tourData.tourId,
                                tour_name: tourData.tourName,
                                booking_date: tourData.date,
                                booking_time: tourData.time,
                                payment_provider: paymentData.provider
                            }
                        });

                        console.log('✅ Thank you page conversion data sent to GTM');
                    } catch (conversionError) {
                        console.error('❌ GTM conversion data push failed:', conversionError);
                    }

                    console.log('🎯 Comprehensive purchase conversion tracking completed');
                } else {
                    console.error('❌ Purchase conversion tracking failed:', purchaseResult.reason);
                }

                // GTM manages data cleanup automatically, so we only clean up minimal session storage
                // Keep only essential data that might be needed for customer service
                const keysToKeep = ['booking_customer_email', 'booking_customer_name'];
                const allSessionKeys = Object.keys(sessionStorage);

                allSessionKeys.forEach(key => {
                    if (key.startsWith('booking_') && !keysToKeep.includes(key)) {
                        try {
                            sessionStorage.removeItem(key);
                        } catch (error) {
                            console.warn(`Failed to remove session storage key: ${key}`, error);
                        }
                    }
                });

                console.log('🧹 Session storage cleanup completed (GTM manages conversion data)');

            } catch (error) {
                console.error('❌ Error in purchase conversion tracking:', error);

                // Fallback tracking in case of errors
                try {
                    gtmService.pushEvent('purchase', {
                        transaction_id: `fallback_${Date.now()}`,
                        value: 7000,
                        currency: 'JPY',
                        items: [{
                            item_id: 'tour-booking',
                            item_name: 'Kyoto Tour Booking',
                            item_category: 'tour',
                            price: 7000,
                            quantity: 1
                        }],
                        custom_parameters: {
                            fallback_tracking: true,
                            conversion_page: 'thank_you',
                            error_occurred: true
                        }
                    });
                    console.log('🔄 Fallback purchase tracking completed');
                } catch (fallbackError) {
                    console.error('❌ Fallback tracking also failed:', fallbackError);
                }
            }
        };

        // Execute purchase conversion tracking
        trackPurchaseConversion();
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