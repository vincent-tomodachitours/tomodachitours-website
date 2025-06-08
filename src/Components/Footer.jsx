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
        <div className='w-full h-20 mt-12 px-4 py-2 bg-stone-200 flex flex-row justify-between md:justify-center md:gap-10'>
            <div className='contact flex flex-col gap-2 justify-center items-center font-ubuntu text-xs md:text-base'>
                <span>contact@tomodachitours.com</span>
                <span>+81 090 5960 9701</span>
            </div>
            <div className='w-12 md:w-auto flex justify-center items-center'>
                <Link to="/">
                    {isMobile ? <img src={logoMobile} alt="Tomodachi Tours logo" className='h-full md:h-16 overflow-hidden md:object-fit' /> : <img src={logo} alt="Tomodachi Tours logo" className='h-16' />}
                </Link>
            </div>
            <div className='flex flex-col gap-2 justify-center items-center font-ubuntu text-xs md:text-base text-green-700 underline'>
                <Link to="/cancellation-policy">Cancellation Policy</Link>
                <Link to="/commercial-disclosure">Commercial Disclosure</Link>
            </div>
        </div>
    )
}

export default Footer