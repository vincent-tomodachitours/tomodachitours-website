import React from 'react'
import { Link } from 'react-router-dom'

const DisplayProduct3 = ({ side, image1, image1Alt, image2, image2Alt, image3, image3Alt, title, par, price, link }) => {
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
                        <Link to={link} className='border-2 border-black rounded-full p-3 mx-auto'>Learn More</Link>
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
                        <Link to={link} className='border-2 border-black rounded-full p-3 mx-auto'>Learn More</Link>
                    </div>
                </div>
            }
        </div>
    )
}

export default DisplayProduct3