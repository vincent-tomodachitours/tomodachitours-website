import React from 'react'
import Header1 from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { ReactComponent as CheckCircle } from '../SVG/check-circle.svg'
import { ReactComponent as Instagram } from '../SVG/instagram.svg'
import { ReactComponent as Whatsapp } from '../SVG/whatsapp.svg'
import { Link } from 'react-router-dom'

const Thankyou = () => {
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