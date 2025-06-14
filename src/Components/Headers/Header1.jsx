import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../IMG/Logo/dark-grey-logo-full-final-no-bg.webp'
import { ReactComponent as CloseCircle } from '../../SVG/close-circle.svg'
import { ReactComponent as HamburgerMenu } from '../../SVG/hamburger-menu.svg'

const Header1 = () => {
    const [menuOpen, setMenuOpen] = useState(false);

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
                        <div className='fixed inset-0 w-full h-full bg-white z-50 grid place-items-center'>
                            <button className='absolute right-4 top-4 w-12 h-12' onClick={() => setMenuOpen(false)}>
                                <CloseCircle className="w-full h-full" />
                            </button>
                            <div className='w-1/2 h-1/2 m-auto'>
                                <ul className='font-ubuntu text-4xl text-center flex flex-col space-y-10'>
                                    <li onClick={() => setMenuOpen(false)}>
                                        <Link to="/" className='text-gray-700 hover:text-blue-600 transition-colors'>Home</Link>
                                    </li>
                                    <li onClick={() => setMenuOpen(false)}>
                                        <Link to="/about" className='text-gray-700 hover:text-blue-600 transition-colors'>About</Link>
                                    </li>
                                    <li onClick={() => setMenuOpen(false)}>
                                        <Link to="/recommendations" className='text-gray-700 hover:text-blue-600 transition-colors'>Guide</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Header1