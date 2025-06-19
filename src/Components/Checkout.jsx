import React, { useEffect, useRef, useState } from 'react'

import CardForm from './CardForm';
import { Link } from 'react-router-dom';

import 'react-phone-input-2/lib/style.css'
import PhoneInput from 'react-phone-input-2';
import Loading from './Loading';

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
        <div className='fixed inset-0 h-screen bg-black bg-opacity-50 flex justify-end z-40'>
            {paymentProcessing ? <Loading /> : null}
            {/**white box in front of transparent black bg */}
            <div className='bg-white w-11/12 md:w-3/4 h-4/5 rounded-md m-auto py-6 overflow-y-auto'>
                <div className='header relative w-11/12 mx-auto mt-2'>
                    <div className='flex gap-4'>
                        <button className='font-roboto font-bold text-4xl text-blue-700' onClick={onClose}>&lt;</button>
                        <span className='font-roboto font-bold text-4xl'>CHECKOUT</span>
                    </div>
                </div>
                <div className='body w-11/12 mx-auto my-8 flex flex-col md:flex-row gap-10'>
                    {/** Contact information form */}
                    <div className='form basis-2/3'>
                        <div className='flex flex-col gap-6 border border-gray-300 bg-stone-100 rounded-lg py-6 px-6 md:px-12'>
                            <div>
                                <h2 className='font-roboto text-2xl font-bold mb-4'>Lead traveller's contact information</h2>
                                <div className='w-full border-t-2 bg-gray-300 mb-6' /> {/**Gray divider line */}
                                <form className='grid grid-cols-1 md:grid-cols-2 gap-4' >
                                    <div>
                                        <label className="font-ubuntu text-md" for="fname">First name</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='fname' name='fname' value={formData.fname} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" for="lname">Last name</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='lname' name='lname' value={formData.lname} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" htmlFor="email">Email address</label><br />
                                        <input
                                            className={`w-full h-10 rounded-md border ${emailTouched && emailError ? 'border-red-500' : 'border-gray-300'} px-2 font-ubuntu`}
                                            type="email"
                                            id='email'
                                            name='email'
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={() => {
                                                setEmailTouched(true);
                                                setEmailError(validateEmail(formData.email));
                                            }}
                                        />
                                        {emailTouched && emailError && (
                                            <p className="text-red-500 text-sm mt-1 font-ubuntu">{emailError}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" for="phone">Phone number</label><br />
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
                                                height: '2.5rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #D1D5DB',
                                                paddingLeft: '3rem',
                                                paddingRight: '0.5rem',
                                                fontFamily: 'Ubuntu',
                                                fontSize: '1rem'
                                            }}
                                            enableSearch
                                        />
                                    </div>
                                    {/**<button type="submit" className='bg-blue-700 text-white font-ubuntu rounded-md p-2'>Create Booking</button>*/}
                                </form>
                            </div>
                            <div>
                                <h2 className='font-roboto text-2xl font-bold mb-4'>Payment information</h2>
                                <div className='w-full border-t-2 bg-gray-300 mb-6' />
                                <div className='mt-6'>
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
                    </div>
                    {/**Purchase summary **/}
                    <div className='details basis-1/3 border border-gray-300 rounded-lg py-6 px-6 md:px-12 font-roboto'>
                        <h2 className='font-bold text-2xl text-blue-600'>Order Summary</h2>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div className="flex items-center justify-between mb-4">
                            <div className="font-bold text-lg text-gray-700" style={{ maxWidth: '60%' }}>
                                {tourName}
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-extrabold text-gray-700">{tourTime}</div>
                                <div className="text-md text-gray-500 mt-1">{tourDate}</div>
                            </div>
                        </div>
                        <div>
                            <div className='flex justify-between'>
                                <span>Adults: {adult}</span>
                                <span>¥{adult * tourPrice}</span>
                            </div>
                            {child !== 0 ? <div className='flex justify-between'>
                                <span>Children: {child}</span>
                                <span>¥{child * tourPrice}</span>
                            </div> : null}
                            {infant !== 0 ? <div className='flex justify-between'>
                                <span>Infants: {infant}</span>
                                <span>FREE</span>
                            </div> : null}
                        </div>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div>
                            <label className="font-ubuntu text-md" htmlFor="discount">Discount code</label>
                            <div className='flex gap-2'>
                                <input
                                    className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu'
                                    type="text"
                                    id='discount'
                                    name='discount'
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && discountCode.trim() && !discountLoading && !appliedDiscount) {
                                            handleApplyDiscount();
                                        }
                                    }}
                                    disabled={appliedDiscount !== null}
                                />
                                <button
                                    className={`p-2 rounded-md font-roboto font-bold text-white ${discountLoading ? 'bg-gray-400' :
                                        appliedDiscount ? 'bg-green-600' : 'bg-blue-600'
                                        }`}
                                    onClick={appliedDiscount ? () => {
                                        setAppliedDiscount(null);
                                        setDiscountCode('');
                                        setDiscountError('');
                                    } : handleApplyDiscount}
                                    disabled={discountLoading}
                                >
                                    {discountLoading ? 'Checking...' :
                                        appliedDiscount ? 'Remove' : 'Apply'}
                                </button>
                            </div>
                            {discountError && (
                                <p className="text-red-500 text-sm mt-1 font-ubuntu">{discountError}</p>
                            )}
                            {appliedDiscount && (
                                <p className="text-green-500 text-sm mt-1 font-ubuntu">
                                    Discount applied: -{appliedDiscount.type === 'percentage' ?
                                        `${appliedDiscount.value}%` :
                                        `¥${appliedDiscount.value.toLocaleString('en-US')}`}
                                </p>
                            )}
                        </div>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div className='flex justify-between'>
                            <span className='font-bold text-2xl'>Order Total</span>
                            <div className="text-right">
                                {appliedDiscount && (
                                    <div className="text-sm text-gray-500 line-through font-roboto">
                                        ¥{appliedDiscount.originalAmount.toLocaleString('en-US')}
                                    </div>
                                )}
                                <span className='font-medium text-2xl'>¥{finalPrice.toLocaleString('en-US')}</span>
                            </div>
                        </div>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div className='flex items-start gap-2 mb-2'>
                            <input className='h-full mt-2 cursor-pointer' type='checkbox' name='terms' checked={formData.terms} onChange={handleInputChange} />
                            <span> I have read and agree to the <Link to="/commercial-disclosure" className='text-blue-600'>Terms and Conditions</Link>.</span>
                        </div>
                        {
                            paymentAllowed ?
                                <button onClick={handlePayNowButton} className='w-full h-12 rounded-lg bg-blue-600 shadow-lg shadow-blue-400 font-bold text-white'>PAY NOW</button>
                                :
                                <button className='w-full h-12 rounded-lg bg-gray-500 shadow-lg font-bold text-white cursor-default'>PAY NOW</button>
                        }
                    </div>
                </div>
                <div className='footer absolute bottom-4 w-full'>
                    <span>Cancellation Policy</span>
                </div>
            </div>
        </div>
    )
}

export default Checkout