import { useState, useEffect, useCallback, useRef } from 'react';
import bookingFlowManager from '../../services/bookingFlowManager';
import gtmService from '../../services/gtmService';
import { UseCheckoutLogicParams, UseCheckoutLogicReturn, CheckoutFormData } from '../../types';

export const useCheckoutLogic = ({
    sheetId,
    tourName,
    adult,
    child,
    infant,
    tourDate,
    tourTime,
    tourPrice
}: UseCheckoutLogicParams): UseCheckoutLogicReturn => {
    // State management
    const [paymentProcessing, setPaymentProcessing] = useState<boolean>(false);
    const [discountCode, setDiscountCode] = useState<string>('');
    const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
    const [discountLoading, setDiscountLoading] = useState<boolean>(false);
    const [discountError, setDiscountError] = useState<string>('');
    const [emailError, setEmailError] = useState<string>('');
    const [emailTouched, setEmailTouched] = useState<boolean>(false);
    const [is3DSInProgress, setIs3DSInProgress] = useState<boolean>(false);
    const [paymentAllowed, setPaymentAllowed] = useState<boolean>(false);
    const [formData, setFormData] = useState<CheckoutFormData>({
        fname: '',
        lname: '',
        email: '',
        phone: '',
        terms: false
    });

    // Booking flow state
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [conversionRetryCount, setConversionRetryCount] = useState<number>(0);
    const [conversionValidated, setConversionValidated] = useState<boolean>(false);
    const maxRetries: number = 3;

    const formRef = useRef<any>({});
    const childRef = useRef<any>(null);

    // Calculate final price with discount
    const finalPrice = appliedDiscount ? appliedDiscount.finalAmount : (adult + child) * tourPrice;

    // Email validation function
    const validateEmail = (email: string): string => {
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
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string; type: string; } }) => {
        const { name, value, type } = e.target;
        const checked = 'checked' in e.target ? e.target.checked : false;
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
            const errorMessage = error instanceof Error ? error.message : '';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setDiscountError('Network error. Please check your connection and try again');
            } else if (errorMessage.includes('JSON')) {
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
    const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

    // Cleanup function for timeouts
    const clearAllTimeouts = useCallback(() => {
        timeoutRefs.current.forEach(timeoutId => {
            if (timeoutId) clearTimeout(timeoutId);
        });
        timeoutRefs.current = [];
    }, []);

    // Conversion validation and retry logic
    const validateConversionFiring = useCallback(async (conversionType: string, trackingData: any) => {
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

                        // Don't retry if payment has been completed
                        try {
                            const paymentCompleted = sessionStorage.getItem('payment_completed') === 'true';
                            if (paymentCompleted) {
                                console.log('Skipping conversion retry - payment already completed');
                                return;
                            }
                        } catch (error) {
                            // Continue with retry if we can't check the flag
                        }

                        try {
                            setConversionRetryCount(prev => prev + 1);

                            if (conversionType === 'begin_checkout') {
                                const trackingResult = bookingFlowManager.trackBeginCheckout({ customerData: trackingData.user_data });
                                if (trackingResult.success && trackingResult.data) {
                                    gtmService.trackBeginCheckoutConversion(
                                        trackingResult.data,
                                        trackingData.user_data || null
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

    const retryConversionTracking = useCallback((conversionType: string, data: any, pricingContext: any = {}) => {
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

            // Don't retry if payment has been completed
            try {
                const paymentCompleted = sessionStorage.getItem('payment_completed') === 'true';
                if (paymentCompleted) {
                    console.log('Skipping conversion retry - payment already completed');
                    return;
                }
            } catch (error) {
                // Continue with retry if we can't check the flag
            }

            try {
                setConversionRetryCount(prev => prev + 1);

                if (conversionType === 'begin_checkout') {
                    const trackingResult = bookingFlowManager.trackBeginCheckout(data);
                    if (trackingResult.success && trackingResult.data) {
                        gtmService.trackBeginCheckoutConversion(
                            trackingResult.data,
                            data.customerData,
                            pricingContext
                        );
                    }
                } else if (conversionType === 'add_payment_info') {
                    const trackingResult = bookingFlowManager.trackAddPaymentInfo(data.paymentData);
                    if (trackingResult.success && trackingResult.data) {
                        gtmService.trackAddPaymentInfoConversion(
                            trackingResult.data,
                            data.customerData
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

        let interval: NodeJS.Timeout | null = null;
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
                        amount: appliedDiscount.originalAmount - appliedDiscount.finalAmount,
                        percentage: appliedDiscount.type === 'percentage' ? appliedDiscount.value : undefined,
                        code: appliedDiscount.code
                    } : undefined,
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
                    customerData: undefined // Don't include customer data in initial tracking
                };

                const trackingResult = bookingFlowManager.trackBeginCheckout(checkoutData);

                if (trackingResult.success && trackingResult.data) {
                    // Only fire GTM conversion for new tracking (not already tracked)
                    gtmService.trackBeginCheckoutConversion(
                        trackingResult.data,
                        undefined, // No customer data initially
                        pricingContext
                    );

                    await validateConversionFiring('begin_checkout', trackingResult.data);
                } else if (trackingResult.reason === 'already_tracked') {
                    console.log('Begin checkout already tracked, skipping GTM conversion');
                } else {
                    console.warn('Begin checkout tracking failed:', trackingResult.reason);
                    retryConversionTracking('begin_checkout', checkoutData, pricingContext);
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
    }, [sheetId, tourName, finalPrice, adult, child, infant, tourDate, tourTime, tourPrice, fallbackBeginCheckoutTracking, retryConversionTracking, validateConversionFiring]);

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