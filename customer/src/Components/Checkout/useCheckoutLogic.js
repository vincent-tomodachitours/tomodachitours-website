import { useState, useEffect, useCallback, useRef } from 'react';
import bookingFlowManager from '../../services/bookingFlowManager';
import gtmService from '../../services/gtmService';

export const useCheckoutLogic = ({
    sheetId,
    tourName,
    adult,
    child,
    infant,
    tourDate,
    tourTime,
    tourPrice
}) => {
    // State management
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [is3DSInProgress, setIs3DSInProgress] = useState(false);
    const [paymentAllowed, setPaymentAllowed] = useState(false);
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        phone: '',
        terms: false
    });

    // Booking flow state
    const [bookingId, setBookingId] = useState(null);
    const [conversionRetryCount, setConversionRetryCount] = useState(0);
    const [conversionValidated, setConversionValidated] = useState(false);
    const maxRetries = 3;

    const formRef = useRef({});
    const childRef = useRef();

    // Calculate final price with discount
    const finalPrice = appliedDiscount ? appliedDiscount.finalAmount : (adult + child) * tourPrice;

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return 'Email is required';
        }
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        formRef.current = {
            ...formRef.current,
            date: tourDate,
            time: tourTime,
            adults: adult,
            children: child,
            infants: infant,
            name: formData.fname + " " + formData.lname,
            phone: `'${formData.phone}`,
            email: formData.email,
        };
    };

    // Handle email blur for validation
    const handleEmailBlur = () => {
        setEmailTouched(true);
        setEmailError(validateEmail(formData.email));
    };

    // Handle discount application
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;

        setDiscountLoading(true);
        setDiscountError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/validate-discount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    code: discountCode,
                    originalAmount: (adult + child) * tourPrice
                }),
            });

            if (!response.ok) {
                // Handle specific HTTP status codes with user-friendly messages
                if (response.status === 400) {
                    setDiscountError('Discount code doesn\'t exist');
                } else if (response.status === 404) {
                    setDiscountError('Discount code doesn\'t exist');
                } else if (response.status === 410) {
                    setDiscountError('Discount code has expired');
                } else if (response.status === 429) {
                    setDiscountError('Too many attempts. Please try again later');
                } else if (response.status >= 500) {
                    setDiscountError('Server error. Please try again later');
                } else {
                    setDiscountError('Discount code doesn\'t exist');
                }
                setAppliedDiscount(null);
                return;
            }

            const responseText = await response.text();
            if (!responseText) {
                setDiscountError('Server error. Please try again later');
                setAppliedDiscount(null);
                return;
            }

            const result = JSON.parse(responseText);

            if (result.success) {
                setAppliedDiscount({
                    code: result.code,
                    type: result.type,
                    value: result.value,
                    originalAmount: result.originalAmount,
                    finalAmount: result.discountedPrice
                });
                setDiscountError('');
            } else {
                // Use server-provided error message or fallback to user-friendly message
                const errorMessage = result.error || result.message;
                if (errorMessage && errorMessage.toLowerCase().includes('not found')) {
                    setDiscountError('Discount code doesn\'t exist');
                } else if (errorMessage && errorMessage.toLowerCase().includes('expired')) {
                    setDiscountError('Discount code has expired');
                } else if (errorMessage && errorMessage.toLowerCase().includes('invalid')) {
                    setDiscountError('Discount code doesn\'t exist');
                } else {
                    setDiscountError(errorMessage || 'Discount code doesn\'t exist');
                }
                setAppliedDiscount(null);
            }
        } catch (error) {
            console.error('Discount validation error:', error);
            // Provide user-friendly error messages for common issues
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                setDiscountError('Network error. Please check your connection and try again');
            } else if (error.message.includes('JSON')) {
                setDiscountError('Server error. Please try again later');
            } else {
                setDiscountError('Discount code doesn\'t exist');
            }
            setAppliedDiscount(null);
        } finally {
            setDiscountLoading(false);
        }
    };

    // Handle pay now button
    const handlePayNowButton = () => {
        setPaymentProcessing(true);
        if (childRef.current) {
            childRef.current.handleCreateBooking?.();
        }
    };

    // Refs for cleanup
    const timeoutRefs = useRef([]);

    // Cleanup function for timeouts
    const clearAllTimeouts = useCallback(() => {
        timeoutRefs.current.forEach(timeoutId => {
            if (timeoutId) clearTimeout(timeoutId);
        });
        timeoutRefs.current = [];
    }, []);

    // Conversion validation and retry logic
    const validateConversionFiring = useCallback(async (conversionType, trackingData) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const validationResult = await gtmService.validateTagFiring(`google_ads_${conversionType}`);

            if (validationResult) {
                setConversionValidated(true);
                console.log(`Conversion ${conversionType} validated successfully`);
            } else {
                console.warn(`Conversion ${conversionType} validation failed`);
                if (conversionRetryCount < maxRetries) {
                    const timeoutId = setTimeout(() => {
                        // Don't retry if page is hidden
                        if (document.hidden || document.visibilityState === 'hidden') {
                            console.log('Skipping conversion retry - page is hidden');
                            return;
                        }

                        try {
                            setConversionRetryCount(prev => prev + 1);

                            if (conversionType === 'begin_checkout') {
                                const trackingResult = bookingFlowManager.trackBeginCheckout({ customerData: trackingData.user_data });
                                if (trackingResult.success) {
                                    gtmService.trackBeginCheckoutConversion(
                                        trackingResult.data,
                                        { customerData: trackingData.user_data }
                                    );
                                }
                            }

                            console.log(`Retrying ${conversionType} conversion tracking (attempt ${conversionRetryCount + 1})`);
                        } catch (error) {
                            console.error(`Retry ${conversionRetryCount + 1} failed for ${conversionType}:`, error);
                        }
                    }, 2000 * (conversionRetryCount + 1));

                    timeoutRefs.current.push(timeoutId);
                }
            }
        } catch (error) {
            console.error('Conversion validation failed:', error);
        }
    }, [conversionRetryCount, maxRetries]);

    const retryConversionTracking = useCallback((conversionType, data, pricingContext = {}) => {
        if (conversionRetryCount >= maxRetries) {
            console.error(`Max retries reached for ${conversionType} conversion tracking`);
            return;
        }

        const timeoutId = setTimeout(() => {
            // Don't retry if page is hidden
            if (document.hidden || document.visibilityState === 'hidden') {
                console.log('Skipping conversion retry - page is hidden');
                return;
            }

            try {
                setConversionRetryCount(prev => prev + 1);

                if (conversionType === 'begin_checkout') {
                    const trackingResult = bookingFlowManager.trackBeginCheckout(data);
                    if (trackingResult.success) {
                        gtmService.trackBeginCheckoutConversion(
                            trackingResult.data,
                            data.customerData,
                            pricingContext
                        );
                    }
                } else if (conversionType === 'add_payment_info') {
                    const trackingResult = bookingFlowManager.trackAddPaymentInfo(data.paymentData);
                    if (trackingResult.success) {
                        gtmService.trackAddPaymentInfoConversion(
                            trackingResult.data,
                            data.customerData,
                            pricingContext
                        );
                    }
                }

                console.log(`Retrying ${conversionType} conversion tracking (attempt ${conversionRetryCount + 1})`);
            } catch (error) {
                console.error(`Retry ${conversionRetryCount + 1} failed for ${conversionType}:`, error);
            }
        }, 2000 * (conversionRetryCount + 1));

        timeoutRefs.current.push(timeoutId);
    }, [conversionRetryCount, maxRetries]);

    const fallbackBeginCheckoutTracking = useCallback(() => {
        try {
            const fallbackData = {
                currency: 'JPY',
                value: finalPrice,
                items: [{
                    item_id: sheetId,
                    item_name: tourName,
                    item_category: 'Tour',
                    quantity: 1,
                    price: finalPrice
                }],
                tour_date: tourDate,
                tour_time: tourTime,
                checkout_step: 1,
                checkout_timestamp: Date.now()
            };

            gtmService.trackBeginCheckoutConversion(fallbackData);
            console.log('Fallback begin checkout tracking executed');
        } catch (error) {
            console.error('Fallback begin checkout tracking failed:', error);
        }
    }, [finalPrice, sheetId, tourName, tourDate, tourTime]);

    // Form validation effect
    useEffect(() => {
        const { fname, lname, email, phone, terms } = formData;
        const emailValidationError = validateEmail(email);

        if (emailTouched) {
            setEmailError(emailValidationError);
        }

        const allFieldsFilled =
            fname.trim() !== '' &&
            lname.trim() !== '' &&
            email.trim() !== '' &&
            (!emailTouched || !emailValidationError) &&
            phone.trim() !== '' &&
            terms === true;

        setPaymentAllowed(allFieldsFilled);
    }, [formData, emailTouched]);

    // 3D Secure monitoring effect with page visibility handling
    useEffect(() => {
        const check3DSStatus = () => {
            // Don't run checks if page is hidden/inactive
            if (document.hidden || document.visibilityState === 'hidden') {
                return;
            }

            try {
                const is3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
                    localStorage.getItem('payjp_3ds_in_progress') === 'true';
                setIs3DSInProgress(is3DS);
            } catch (error) {
                console.warn('Error checking 3DS status:', error);
            }
        };

        check3DSStatus();

        let interval;
        if (paymentProcessing) {
            interval = setInterval(check3DSStatus, 1000); // Reduced frequency from 100ms to 1s
        }

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Clear interval when page becomes hidden
                if (interval) {
                    clearInterval(interval);
                    interval = null;
                }
            } else if (paymentProcessing && !interval) {
                // Restart interval when page becomes visible again
                interval = setInterval(check3DSStatus, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [paymentProcessing]);

    // Initialize booking flow effect - only run once when component mounts
    useEffect(() => {
        const initializeBookingFlow = async () => {
            try {
                const originalPrice = (adult + child) * tourPrice;

                const tourData = {
                    tourId: sheetId,
                    tourName: tourName,
                    price: originalPrice,
                    date: tourDate,
                    time: tourTime,
                    location: 'Kyoto',
                    category: 'tour'
                };

                const newBookingId = bookingFlowManager.initializeBooking(tourData);
                setBookingId(newBookingId);

                const pricingContext = {
                    basePrice: tourPrice,
                    quantity: adult + child,
                    originalPrice: originalPrice,
                    discount: appliedDiscount ? {
                        type: appliedDiscount.type,
                        value: appliedDiscount.value,
                        code: appliedDiscount.code,
                        maxDiscountAmount: appliedDiscount.originalAmount - appliedDiscount.finalAmount
                    } : null,
                    options: {
                        pricingRules: [
                            { type: 'minimum', value: 1000 },
                            { type: 'round', value: 100 }
                        ]
                    }
                };

                const checkoutData = {
                    value: finalPrice,
                    currency: 'JPY',
                    originalPrice: originalPrice,
                    discount: pricingContext.discount,
                    items: [{
                        item_id: sheetId,
                        item_name: tourName,
                        item_category: 'tour',
                        price: finalPrice,
                        quantity: 1
                    }],
                    customerData: null // Don't include customer data in initial tracking
                };

                const trackingResult = bookingFlowManager.trackBeginCheckout(checkoutData);

                if (trackingResult.success) {
                    gtmService.trackBeginCheckoutConversion(
                        trackingResult.data,
                        null, // No customer data initially
                        pricingContext
                    );

                    await validateConversionFiring('begin_checkout', trackingResult.data);
                } else {
                    console.warn('Begin checkout tracking failed:', trackingResult.reason);
                    if (trackingResult.reason !== 'already_tracked') {
                        retryConversionTracking('begin_checkout', checkoutData, pricingContext);
                    }
                }

                try {
                    sessionStorage.setItem('checkout_data', JSON.stringify({
                        bookingId: newBookingId,
                        tourData,
                        checkoutStartTime: Date.now(),
                        checkoutStep: 1,
                        originalPrice: originalPrice,
                        finalPrice: finalPrice,
                        discountApplied: appliedDiscount ? true : false,
                        discountAmount: appliedDiscount ? (appliedDiscount.originalAmount - appliedDiscount.finalAmount) : 0,
                        pricingContext: pricingContext
                    }));
                } catch (error) {
                    console.warn('Failed to store checkout data:', error);
                }

            } catch (error) {
                console.error('Failed to initialize booking flow:', error);
                fallbackBeginCheckoutTracking();
            }
        };

        initializeBookingFlow();
    }, [sheetId, tourName, finalPrice, adult, child, infant, tourDate, tourTime, appliedDiscount, tourPrice, fallbackBeginCheckoutTracking, retryConversionTracking, validateConversionFiring]);

    // Cleanup effect for component unmount
    useEffect(() => {
        return () => {
            clearAllTimeouts();
        };
    }, [clearAllTimeouts]);

    // Page visibility cleanup effect
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Clear all timeouts when page becomes hidden to prevent errors
                clearAllTimeouts();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearAllTimeouts();
        };
    }, [clearAllTimeouts]);

    return {
        // State
        paymentProcessing,
        setPaymentProcessing,
        discountCode,
        setDiscountCode,
        appliedDiscount,
        discountLoading,
        discountError,
        emailError,
        emailTouched,
        is3DSInProgress,
        setIs3DSInProgress,
        paymentAllowed,
        formData,
        finalPrice,
        bookingId,
        conversionValidated,
        conversionRetryCount,
        maxRetries,

        // Refs
        childRef,
        formRef,

        // Handlers
        handleInputChange,
        handleEmailBlur,
        handleApplyDiscount,
        handlePayNowButton
    };
};