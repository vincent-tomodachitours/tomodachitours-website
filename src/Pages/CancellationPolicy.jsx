import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'

const CancellationPolicy = () => {
    return (
        <div className='bg-stone-300 w-full flex flex-col justify-between min-h-screen h-screen'>
            <Header />
            <div className='font-ubuntu mx-auto w-5/6'>
                <h1 className='font-ubuntu text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Cancellation Policy</h1>
                <p className='mb-2 text-md md:text-lg'>You can cancel up to 24 hours in advance of the experience for a full refund.</p>
                <ul className='list-disc pl-8 text-md md:text-lg mb-12'>
                    <li>For a full refund, you must cancel at least 24 hours before the experience's start time.</li>
                    <li>If you cancel less than 24 hours before the experience's start time, the amount you paid will not be refunded.</li>
                    <li>Any changes made less than 24 hours before the experience's start time will not be accepted.</li>
                    <li>Cut-off times are based on the experience's local time.</li>
                </ul>
                <div className='flex justify-center'>
                    <Link
                        to="/cancel-booking"
                        className='group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 ease-in-out'
                    >
                        <span className='absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-xl'></span>
                        <span className='relative flex items-center'>
                            Cancel Your Booking
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default CancellationPolicy