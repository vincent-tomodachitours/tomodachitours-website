import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../IMG/Logo/dark-grey-logo-full-final-no-bg.webp'
import logoMobile from '../IMG/Logo/dark-gray-logo-final-no-bg.png'

const Footer = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <footer className='w-full bg-gradient-to-b from-stone-100 to-stone-200 shadow-inner mt-16'>
            <div className='container mx-auto px-4 py-3'>
                <div className='flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8'>
                    {/* Contact Information */}
                    <div className='contact flex flex-col gap-1.5 items-center md:items-start text-sm'>
                        <a
                            href="mailto:contact@tomodachitours.com"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>contact@tomodachitours.com</span>
                        </a>
                        <a
                            href="tel:+81-090-5960-9701"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+81 090 5960 9701</span>
                        </a>
                    </div>

                    {/* Logo */}
                    <Link to="/" className='block transition-transform duration-200 hover:scale-105 py-1'>
                        {isMobile ? (
                            <img
                                src={logoMobile}
                                alt="Tomodachi Tours logo"
                                className='h-14 w-auto object-contain'
                            />
                        ) : (
                            <img
                                src={logo}
                                alt="Tomodachi Tours logo"
                                className='h-14 w-auto object-contain'
                            />
                        )}
                    </Link>

                    {/* Links */}
                    <div className='grid grid-cols-2 gap-1.5 text-sm'>
                        <Link
                            to="/cancellation-policy"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Cancellation Policy</span>
                        </Link>
                        <Link
                            to="/privacy-policy"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Privacy Policy</span>
                        </Link>
                        <Link
                            to="/terms-of-service"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Terms of Service</span>
                        </Link>
                        <Link
                            to="/commercial-disclosure"
                            className='text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center gap-1.5'
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Commercial Disclosure</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer