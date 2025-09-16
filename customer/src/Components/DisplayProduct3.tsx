import React from 'react';
import { Link } from 'react-router-dom';

interface DisplayProduct3Props {
    side: 'left' | 'right';
    image1: string;
    image1Alt: string;
    image2: string;
    image2Alt: string;
    image3: string;
    image3Alt: string;
    title: string;
    par: string;
    price: string;
    link: string;
}

const DisplayProduct3: React.FC<DisplayProduct3Props> = ({ side, image1, image1Alt, image2, image2Alt, image3, image3Alt, title, par, price, link }) => {
    return (
        <div>
            {side === "left" ?
                <div className='flex flex-col lg:flex-row gap-6 lg:gap-24 my-8'>
                    <div className='flex basis-1/2 gap-2 md:gap-4 h-[46vh] lg:h-[60vh]'>
                        <div className='flex flex-col basis-1/2 gap-2 md:gap-4'>
                            <img src={image1} alt={image1Alt} className='w-full h-1/2 object-cover rounded-2xl' />
                            <img src={image2} alt={image2Alt} className='w-full h-1/2 object-cover rounded-2xl' />
                        </div>
                        <div className='basis-1/2'>
                            <img src={image3} alt={image3Alt} className='w-full h-full object-cover rounded-2xl' />
                        </div>
                    </div>
                    <div className='basis-1/2 flex flex-col gap-4 lg:gap-10'>
                        <h2 className='font-black text-3xl xl:text-5xl flex-1'>{title}</h2>
                        <span className='text-2xl xl:text-4xl font-black flex-1'>{price}</span>
                        <p className='text-lg lg:text-2xl'>{par}</p>
                        <Link
                            to={link}
                            className='group relative inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 ease-in-out w-max mx-auto'
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
                :
                <div className='flex flex-col lg:flex-row-reverse gap-10 my-8'>
                    <div className='flex basis-1/2 gap-2 md:gap-4 h-[46vh] lg:h-[60vh]'>
                        <div className='flex flex-col basis-1/2 gap-2 md:gap-4'>
                            <img src={image1} alt={image1Alt} className='w-full h-1/2 object-cover rounded-2xl' />
                            <img src={image2} alt={image2Alt} className='w-full h-1/2 object-cover rounded-2xl' />
                        </div>
                        <div className='basis-1/2'>
                            <img src={image3} alt={image3Alt} className='w-full h-full object-cover rounded-2xl' />
                        </div>
                    </div>
                    <div className='basis-1/2 flex flex-col gap-4 lg:gap-10'>
                        <h2 className='font-black text-3xl xl:text-5xl flex-1'>{title}</h2>
                        <span className='text-2xl xl:text-4xl font-black flex-1'>{price}</span>
                        <p className='text-lg lg:text-2xl'>{par}</p>
                        <Link
                            to={link}
                            className='group relative inline-flex items-center justify-center px-6 py-3 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 ease-in-out w-max mx-auto'
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
            }
        </div>
    )
}

export default DisplayProduct3