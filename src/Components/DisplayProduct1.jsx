import React from 'react'
import { Link } from 'react-router-dom'

const DisplayProduct1 = ({ image, imageAlt, title, par, price, link }) => {
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
                <Link to={link} className='border-2 border-black rounded-full p-3'>Book Online</Link>
            </div>
        </div>
    )
}

export default DisplayProduct1