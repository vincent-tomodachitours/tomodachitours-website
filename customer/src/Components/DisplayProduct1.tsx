import React from 'react';
import { Link } from 'react-router-dom';

interface DisplayProduct1Props {
    image: string;
    imageAlt: string;
    title: string;
    par: string;
    price: string;
    link: string;
}

const DisplayProduct1: React.FC<DisplayProduct1Props> = ({ image, imageAlt, title, par, price, link }) => {
    return (
        <div className='flex flex-col justify-between gap-6'>
            <div className='h-[22rem] md:h-[24rem]'>
                <img src={image} alt={imageAlt} className='w-full h-full object-cover overflow-hidden rounded-2xl' />
            </div>
            <div>
                <h2 className='text-3xl'>{title}</h2>
            </div>
            <div>
                <p>{par}</p>
            </div>
            <div className='flex items-center justify-between'>
                <span className='text-4xl'>{price}</span>
                <Link
                    to={link}
                    className='group relative inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 ease-in-out'
                >
                    <span className='absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-xl'></span>
                    <span className='relative flex items-center'>
                        Book Online
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                </Link>
            </div>
        </div>
    )
}

export default DisplayProduct1