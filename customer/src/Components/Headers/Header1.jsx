import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../IMG/Logo/dark-grey-logo-full-final-no-bg.webp'
import { ReactComponent as HamburgerMenu } from '../../SVG/hamburger-menu.svg'

const Header1 = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Lock/unlock scrolling when menu opens/closes
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function to restore scrolling when component unmounts
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuOpen]);

    return (
        <div className='w-full h-20 bg-stone-200'>
            <div className='max-w-7xl h-full mx-auto flex items-center justify-between lg:justify-center relative'>
                <div className='hidden lg:flex gap-6 absolute left-4 font-ubuntu text-sm'>
                    <Link to="/" className='text-gray-700 hover:text-blue-600 transition-colors relative group'>
                        Home
                        <span className='absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></span>
                    </Link>
                    <Link to="/about" className='text-gray-700 hover:text-blue-600 transition-colors relative group'>
                        About
                        <span className='absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></span>
                    </Link>
                    <Link to="/recommendations" className='text-gray-700 hover:text-blue-600 transition-colors relative group'>
                        Recommendations
                        <span className='absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></span>
                    </Link>
                    <Link to="/jobs" className='text-gray-700 hover:text-blue-600 transition-colors relative group'>
                        Jobs
                        <span className='absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left'></span>
                    </Link>
                </div>
                <div className='flex justify-center items-center ml-6 lg:ml-0'>
                    <Link to="/"><img src={logo} alt="Tomodachi Tours logo" className='h-16' /></Link>
                </div>
                <div className='flex justify-center items-center'>
                    <button
                        className="lg:hidden flex absolute right-4 text-gray-700 w-12 h-12"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        <HamburgerMenu className='w-full h-full' />
                    </button>
                    {menuOpen && (
                        <div className='fixed inset-0 w-full h-full bg-white/80 backdrop-blur-md z-50 flex flex-col'>
                            {/* Modern header with close button */}
                            <div className='flex justify-between items-center px-6 py-6 border-b border-gray-100'>
                                <div className='text-2xl font-bold text-gray-800 font-ubuntu'>Menu</div>
                                <button
                                    className='w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center group'
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation items */}
                            <div className='flex-1 flex items-center justify-center px-6'>
                                <nav className='w-full max-w-sm'>
                                    <ul className='space-y-3'>
                                        <li onClick={() => setMenuOpen(false)}>
                                            <Link
                                                to="/"
                                                className='block px-8 py-5 text-xl font-bold text-blue-700 bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/25 hover:border-white/40 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 text-center font-ubuntu transform hover:-translate-y-1 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none'
                                            >
                                                Home
                                            </Link>
                                        </li>
                                        <li onClick={() => setMenuOpen(false)}>
                                            <Link
                                                to="/about"
                                                className='block px-8 py-5 text-xl font-bold text-blue-700 bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/25 hover:border-white/40 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 text-center font-ubuntu transform hover:-translate-y-1 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none'
                                            >
                                                About
                                            </Link>
                                        </li>
                                        <li onClick={() => setMenuOpen(false)}>
                                            <Link
                                                to="/recommendations"
                                                className='block px-8 py-5 text-lg font-bold text-blue-700 bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/25 hover:border-white/40 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 text-center font-ubuntu transform hover:-translate-y-1 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none'
                                            >
                                                Recommendations
                                            </Link>
                                        </li>
                                        <li onClick={() => setMenuOpen(false)}>
                                            <Link
                                                to="/jobs"
                                                className='block px-8 py-5 text-xl font-bold text-blue-700 bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/25 hover:border-white/40 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-300 text-center font-ubuntu transform hover:-translate-y-1 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none'
                                            >
                                                Jobs
                                            </Link>
                                        </li>
                                    </ul>
                                </nav>
                            </div>

                            {/* Footer space for better balance */}
                            <div className='h-20'></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Header1