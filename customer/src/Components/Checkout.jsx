import React, { useEffect, useRef, useState } from 'react'

import CardForm from './CardForm';
import { Link } from 'react-router-dom';

import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2';

const Checkout = ({ onClose, sheetId, tourDate, tourTime, adult, child, infant, tourPrice, tourName }) => {
    //useState to handle payment loading screen
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Discount code state
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountLoading, setDiscountLoading] = useState(false);
    const [discountError, setDiscountError] = useState('');

    // Add email validation state
    const [emailError, setEmailError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);

    // State to track 3D Secure process for UI updates
    const [is3DSInProgress, setIs3DSInProgress] = useState(false);

    //Pay now button from parent(Checkout.jsx) to child(CardForm.jsx)
    const childRef = useRef();
    const handlePayNowButton = () => {
        setPaymentProcessing(true);
        if (childRef.current) {
            childRef.current.handleCreateBooking?.();
        }
    }

    //Check if input fields are filled
    const [paymentAllowed, setPaymentAllowed] = useState(false);
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        phone: '',
        terms: false
    });

    const formRef = useRef({});

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

    // Add discount application function
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) return;

        setDiscountLoading(true);
        setDiscountError('');

        try {
            // Call Supabase Edge Function instead of Firebase
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

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!responseText) {
                throw new Error('Empty response from server');
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
                setDiscountError(result.error || result.message || 'Failed to apply discount code');
                setAppliedDiscount(null);
            }
        } catch (error) {
            console.error('Discount validation error:', error);
            setDiscountError(`Failed to validate discount code: ${error.message}`);
            setAppliedDiscount(null);
        } finally {
            setDiscountLoading(false);
        }
    };

    useEffect(() => {
        const { fname, lname, email, phone, terms } = formData;
        const emailValidationError = validateEmail(email);

        // Only set error if field has been touched
        if (emailTouched) {
            setEmailError(emailValidationError);
        }

        const allFieldsFilled =
            fname.trim() !== '' &&
            lname.trim() !== '' &&
            email.trim() !== '' &&
            (!emailTouched || !emailValidationError) && // Only check email validation if touched
            phone.trim() !== '' &&
            terms === true;

        setPaymentAllowed(allFieldsFilled);
    }, [formData, emailTouched]);

    // Monitor session storage for 3D Secure process
    useEffect(() => {
        const check3DSStatus = () => {
            const is3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
                localStorage.getItem('payjp_3ds_in_progress') === 'true';
            setIs3DSInProgress(is3DS);
        };

        // Check initially
        check3DSStatus();

        // Check periodically while payment is processing
        let interval;
        if (paymentProcessing) {
            interval = setInterval(check3DSStatus, 100);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentProcessing]);

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

    // Calculate final price with discount
    const finalPrice = appliedDiscount ? appliedDiscount.finalAmount : (adult + child) * tourPrice;

    return (
        <div className='fixed inset-0 h-screen bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-40 p-4'>
            {/* Modern modal container */}
            <div className='bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative'>

                {/* Processing overlay within the modal */}
                {paymentProcessing && (
                    <div className='absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl'>
                        <div className='bg-white rounded-lg shadow-lg p-8 flex flex-col items-center space-y-4 border border-gray-200'>
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-lg font-semibold text-gray-800">Processing Payment</div>
                            <div className="text-sm text-gray-600 text-center max-w-xs">
                                {is3DSInProgress ? (
                                    <>
                                        Verifying your card with 3D Secure. If a popup window opens, please complete the verification.
                                        <br /><br />
                                        <strong>Do not close this window.</strong>
                                    </>
                                ) : (
                                    'Please wait while we securely process your payment. Do not close this window.'
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className='bg-gradient-to-r from-slate-50 to-white border-b border-gray-100 p-6'>
                    <div className='flex items-center gap-4'>
                        <button
                            className='flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800'
                            onClick={() => {
                                // Check if 3D Secure is in progress and prevent closing
                                const payjp3DS = sessionStorage.getItem('payjp_3ds_in_progress') === 'true' ||
                                    localStorage.getItem('payjp_3ds_in_progress') === 'true';
                                const shouldStayOpen = sessionStorage.getItem('checkout_should_stay_open') === 'true' ||
                                    localStorage.getItem('checkout_should_stay_open') === 'true';
                                if (payjp3DS || shouldStayOpen) {
                                    console.log('🛑 Preventing checkout close button during PayJP 3D Secure verification');
                                    return;
                                }
                                onClose();
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className='font-inter font-bold text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                            Checkout
                        </h1>
                    </div>
                </div>

                {/* Body - scrollable content */}
                <div className='flex-1 overflow-y-auto'>
                    <div className='p-6 lg:p-8'>
                        <div className='flex flex-col xl:flex-row gap-8'>

                            {/* Contact & Payment Information */}
                            <div className='flex-1 space-y-8'>

                                {/* Contact Information Card */}
                                <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
                                    <div className='p-6 lg:p-8'>
                                        <div className='flex items-center gap-3 mb-6'>
                                            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <h2 className='font-inter text-xl font-semibold text-gray-900'>Contact Information</h2>
                                        </div>

                                        <form className='space-y-6'>
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                                <div className='space-y-2'>
                                                    <label className="font-inter text-sm font-medium text-gray-700" htmlFor="fname">
                                                        First Name
                                                    </label>
                                                    <input
                                                        className='w-full h-12 rounded-lg border border-gray-300 px-4 font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                                        type="text"
                                                        id='fname'
                                                        name='fname'
                                                        value={formData.fname}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your first name"
                                                        disabled={paymentProcessing}
                                                    />
                                                </div>
                                                <div className='space-y-2'>
                                                    <label className="font-inter text-sm font-medium text-gray-700" htmlFor="lname">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        className='w-full h-12 rounded-lg border border-gray-300 px-4 font-inter text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                                        type="text"
                                                        id='lname'
                                                        name='lname'
                                                        value={formData.lname}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter your last name"
                                                        disabled={paymentProcessing}
                                                    />
                                                </div>
                                            </div>

                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                                <div className='space-y-2'>
                                                    <label className="font-inter text-sm font-medium text-gray-700" htmlFor="email">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        className={`w-full h-12 rounded-lg border px-4 font-inter text-gray-900 placeholder-gray-400 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 ${emailTouched && emailError
                                                            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                            : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                                            }`}
                                                        type="email"
                                                        id='email'
                                                        name='email'
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        onBlur={() => {
                                                            setEmailTouched(true);
                                                            setEmailError(validateEmail(formData.email));
                                                        }}
                                                        placeholder="Enter your email address"
                                                        disabled={paymentProcessing}
                                                    />
                                                    {emailTouched && emailError && (
                                                        <p className="text-red-500 text-sm font-inter flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {emailError}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className='space-y-2'>
                                                    <label className="font-inter text-sm font-medium text-gray-700" htmlFor="phone">
                                                        Phone Number
                                                    </label>
                                                    <PhoneInput
                                                        country={'us'}
                                                        onChange={(phone) => {
                                                            const syntheticEvent = {
                                                                target: {
                                                                    name: 'phone',
                                                                    value: phone,
                                                                    type: 'text',
                                                                },
                                                            };
                                                            handleInputChange(syntheticEvent);
                                                        }}
                                                        inputStyle={{
                                                            width: '100%',
                                                            height: '3rem',
                                                            borderRadius: '0.5rem',
                                                            border: '1px solid #D1D5DB',
                                                            paddingLeft: '3.5rem',
                                                            paddingRight: '1rem',
                                                            fontFamily: 'Inter',
                                                            fontSize: '1rem',
                                                            color: '#111827',
                                                            transition: 'all 0.2s ease',
                                                            backgroundColor: paymentProcessing ? '#F9FAFB' : '#FFFFFF'
                                                        }}
                                                        buttonStyle={{
                                                            border: '1px solid #D1D5DB',
                                                            borderRight: 'none',
                                                            borderRadius: '0.5rem 0 0 0.5rem',
                                                            backgroundColor: '#F9FAFB'
                                                        }}
                                                        enableSearch
                                                        disabled={paymentProcessing}
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Payment Information Card */}
                                <div className='bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'>
                                    <div className='p-6 lg:p-8'>
                                        <div className='flex items-center gap-3 mb-6'>
                                            <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>
                                            <h2 className='font-inter text-xl font-semibold text-gray-900'>Payment Information</h2>
                                        </div>

                                        <CardForm
                                            ref={childRef}
                                            totalPrice={finalPrice}
                                            originalPrice={(adult + child) * tourPrice}
                                            appliedDiscount={appliedDiscount}
                                            formRef={formRef}
                                            sheetId={sheetId}
                                            setPaymentProcessing={setPaymentProcessing}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className='w-full xl:w-96'>
                                <div className='bg-gradient-to-br from-slate-50 to-blue-50/30 border border-gray-200 rounded-xl shadow-sm sticky top-0'>
                                    <div className='p-6 lg:p-8'>
                                        <div className='flex items-center gap-3 mb-6'>
                                            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <h2 className='font-inter text-xl font-semibold text-gray-900'>Order Summary</h2>
                                        </div>

                                        {/* Tour Details */}
                                        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 mr-4">
                                                    <h3 className="font-inter font-semibold text-gray-900 text-sm leading-tight mb-3">
                                                        {tourName}
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <span className="font-inter font-semibold text-gray-900 text-base">{tourDate}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <span className="font-inter font-semibold text-gray-900 text-base">{tourTime}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="space-y-3 mb-6">
                                            <div className='flex justify-between items-center'>
                                                <span className='font-inter text-gray-700'>Adults ({adult})</span>
                                                <span className='font-inter font-medium'>¥{(adult * tourPrice).toLocaleString('en-US')}</span>
                                            </div>
                                            {child !== 0 && (
                                                <div className='flex justify-between items-center'>
                                                    <span className='font-inter text-gray-700'>Children ({child})</span>
                                                    <span className='font-inter font-medium'>¥{(child * tourPrice).toLocaleString('en-US')}</span>
                                                </div>
                                            )}
                                            {infant !== 0 && (
                                                <div className='flex justify-between items-center'>
                                                    <span className='font-inter text-gray-700'>Infants ({infant})</span>
                                                    <span className='font-inter font-medium text-green-600'>FREE</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Discount Section */}
                                        <div className="mb-6">
                                            <label className="font-inter text-sm font-medium text-gray-700 mb-2 block">
                                                Discount Code
                                            </label>
                                            <div className='flex gap-2'>
                                                <input
                                                    className='flex-1 h-10 rounded-lg border border-gray-300 px-3 font-inter text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500'
                                                    type="text"
                                                    value={discountCode}
                                                    onChange={(e) => setDiscountCode(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && discountCode.trim() && !discountLoading && !appliedDiscount) {
                                                            handleApplyDiscount();
                                                        }
                                                    }}
                                                    disabled={appliedDiscount !== null || paymentProcessing}
                                                    placeholder="Enter code"
                                                />
                                                <button
                                                    className={`px-4 py-2 rounded-lg font-inter font-medium text-base transition-all duration-200 ${discountLoading || paymentProcessing
                                                        ? 'bg-gray-400 text-white cursor-not-allowed'
                                                        : appliedDiscount
                                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                                                        }`}
                                                    onClick={appliedDiscount ? () => {
                                                        setAppliedDiscount(null);
                                                        setDiscountCode('');
                                                        setDiscountError('');
                                                    } : handleApplyDiscount}
                                                    disabled={discountLoading || paymentProcessing}
                                                >
                                                    {discountLoading ? 'Checking...' : appliedDiscount ? 'Remove' : 'Apply'}
                                                </button>
                                            </div>
                                            {discountError && (
                                                <p className="text-red-500 text-sm mt-2 font-inter flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {discountError}
                                                </p>
                                            )}
                                            {appliedDiscount && (
                                                <p className="text-green-600 text-sm mt-2 font-inter flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Discount applied: -{appliedDiscount.type === 'percentage' ?
                                                        `${appliedDiscount.value}%` :
                                                        `¥${appliedDiscount.value.toLocaleString('en-US')}`}
                                                </p>
                                            )}
                                        </div>

                                        {/* Total */}
                                        <div className='border-t border-gray-200 pt-4 mb-6'>
                                            <div className='flex justify-between items-center'>
                                                <span className='font-inter text-lg font-semibold text-gray-900'>Total</span>
                                                <div className="text-right">
                                                    {appliedDiscount && (
                                                        <div className="text-sm text-gray-500 line-through font-inter mb-1">
                                                            ¥{appliedDiscount.originalAmount.toLocaleString('en-US')}
                                                        </div>
                                                    )}
                                                    <span className='font-inter text-xl font-bold text-gray-900'>
                                                        ¥{finalPrice.toLocaleString('en-US')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Terms and Conditions */}
                                        <div className='flex items-start gap-3 mb-6'>
                                            <input
                                                className='mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50'
                                                type='checkbox'
                                                name='terms'
                                                checked={formData.terms}
                                                onChange={handleInputChange}
                                                disabled={paymentProcessing}
                                            />
                                            <span className='font-inter text-sm text-gray-700 leading-relaxed'>
                                                I have read and agree to the{' '}
                                                <Link to="/commercial-disclosure" className='text-blue-600 hover:text-blue-700 font-medium underline decoration-blue-600/30 hover:decoration-blue-700'>
                                                    Terms and Conditions
                                                </Link>
                                            </span>
                                        </div>

                                        {/* Pay Button */}
                                        <button
                                            onClick={handlePayNowButton}
                                            disabled={!paymentAllowed || paymentProcessing}
                                            className={`w-full h-12 rounded-lg font-inter font-semibold text-white transition-all duration-200 ${paymentAllowed && !paymentProcessing
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transform'
                                                : 'bg-gray-400 cursor-not-allowed shadow-sm'
                                                }`}
                                        >
                                            {paymentProcessing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Processing...
                                                </span>
                                            ) : paymentAllowed ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Complete Payment
                                                </span>
                                            ) : (
                                                'Complete Required Fields'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='bg-gray-50 border-t border-gray-100 p-4'>
                    <div className='flex items-center justify-center gap-2 text-sm text-gray-600'>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <Link to="/cancellation-policy" className='font-inter text-blue-600 hover:text-blue-700 underline decoration-blue-600/30 hover:decoration-blue-700'>
                            Cancellation Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout