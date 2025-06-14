import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'

const CancellationPolicy = () => {
    return (
        <div className='min-h-screen flex flex-col bg-gradient-to-b from-white to-stone-100'>
            <Header />

            <main className='flex-grow container mx-auto px-4 py-12 max-w-4xl'>
                <div className='space-y-8'>
                    {/* Header Section */}
                    <div className='text-center mb-12'>
                        <h1 className='font-ubuntu text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4'>
                            Cancellation Policy
                        </h1>
                        <div className='w-24 h-1 bg-blue-500 mx-auto rounded-full'></div>
                    </div>

                    {/* Main Content */}
                    <div className='bg-white rounded-2xl shadow-lg p-8 space-y-6'>
                        <p className='text-lg md:text-xl text-gray-700 font-medium'>
                            You can cancel up to 24 hours in advance of the experience for a full refund.
                        </p>

                        <div className='space-y-4'>
                            <ul className='space-y-4'>
                                {[
                                    "For a full refund, you must cancel at least 24 hours before the experience's start time.",
                                    "If you cancel less than 24 hours before the experience's start time, the amount you paid will not be refunded.",
                                    "Any changes made less than 24 hours before the experience's start time will not be accepted.",
                                    "Cut-off times are based on the experience's local time."
                                ].map((item, index) => (
                                    <li key={index} className='flex items-start space-x-3 text-gray-700'>
                                        <svg className='w-6 h-6 text-blue-500 flex-shrink-0 mt-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                        </svg>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className='flex justify-center pt-8'>
                        <Link
                            to="/cancel-booking"
                            className='group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-300 ease-in-out'
                        >
                            <span className='absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-xl'></span>
                            <span className='relative flex items-center group-hover:translate-x-1 transition-transform duration-200'>
                                Cancel Your Booking
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </span>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default CancellationPolicy