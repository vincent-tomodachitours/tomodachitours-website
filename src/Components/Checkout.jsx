import React, { useEffect, useRef, useState } from 'react'

import CardForm from './CardForm';
import { Link } from 'react-router-dom';

const API_URL = "https://script.google.com/macros/s/AKfycbzOSSaJX-dzvazzxuLso5EBtjdElQsf4vE_Zh-6PzoY9kiu--cnMEWfjNOx36ai2kRPfg/exec";

const Checkout = ({ onClose, tourName, tourDate, tourTime, adult, child, infant, tourPrice }) => {
    //Pay now button from parent(Checkout.jsx) to child(CardForm.jsx)
    const childRef = useRef();
    const handlePayNowButton = () => {
        if (childRef.current) {
            childRef.current.handleGetToken?.();
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
    })
    useEffect(() => {
        const { fname, lname, email, phone, terms } = formData;
        const allFieldsFilled =
            fname.trim() !== '' &&
            lname.trim() !== '' &&
            email.trim() !== '' &&
            phone.trim() !== '' &&
            terms === true;

        setPaymentAllowed(allFieldsFilled);
    }, [formData]);
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            "date": tourDate,
            "time": tourTime,
            "adults": adult,
            "children": child,
            "infants": infant,
            "name": e.target.fname.value + " " + e.target.lname.value,
            "phone": "'" + e.target.phone.value,
            "email": e.target.email.value
        };

        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(formData),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    return (
        <div className='fixed inset-0 h-screen bg-black bg-opacity-50 flex justify-end z-40'>
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
                                <form className='grid grid-cols-1 md:grid-cols-2 gap-4' onSubmit={handleSubmit}>
                                    <div>
                                        <label className="font-ubuntu text-md" for="fname">First name</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='fname' name='fname' value={formData.fname} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" for="lname">Last name</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='lname' name='lname' value={formData.lname} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" for="email">Email address</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='email' name='email' value={formData.email} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label className="font-ubuntu text-md" for="phone">Phone number</label><br />
                                        <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='phone' name='phone' value={formData.phone} onChange={handleInputChange} />
                                    </div>
                                    {/**<button type="submit" className='bg-blue-700 text-white font-ubuntu rounded-md p-2'>Create Booking</button>*/}
                                </form>
                            </div>
                            <div>
                                <h2 className='font-roboto text-2xl font-bold mb-4'>Payment information</h2>
                                <div className='w-full border-t-2 bg-gray-300 mb-6' />
                                <div className='mt-6'>
                                    <CardForm ref={childRef} totalPrice={(adult + child) * tourPrice} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/**Purchase summary **/}
                    <div className='details basis-1/3 border border-gray-300 rounded-lg py-6 px-6 md:px-12 font-roboto'>
                        <h2 className='font-bold text-2xl text-blue-600'>Order Summary</h2>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <h3 className='text-lg font-bold mb-2'>{tourName}</h3>
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
                            <label className="font-ubuntu text-md" for="discount">Discount code</label>
                            <div className='flex gap-2'>
                                <input className='w-full h-10 rounded-md border border-gray-300 px-2 font-ubuntu' type="text" id='discount' name='discount' />
                                <button className='p-2 bg-blue-600 rounded-md font-roboto font-bold text-white'>Apply</button>
                            </div>
                        </div>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div className='flex justify-between'>
                            <span className='font-bold text-2xl'>Order Total</span>
                            <span className='font-medium text-2xl'>¥{(adult + child) * tourPrice}</span>
                        </div>
                        <div className='w-full border-t-2 bg-gray-300 my-4' />
                        <div className='flex items-start gap-2 mb-2'>
                            <input className='h-full mt-2 cursor-pointer' type='checkbox' name='terms' checked={formData.terms} onChange={handleInputChange} />
                            <span> I have read and agree to the <Link className='text-blue-600 '>Terms and Conditions</Link>.</span>
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