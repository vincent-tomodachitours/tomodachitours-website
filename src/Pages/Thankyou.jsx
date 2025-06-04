import React from 'react'
import Header1 from '../Components/Headers/Header1'
import Footer from '../Components/Footer'
import { ReactComponent as CheckCircle } from '../SVG/check-circle.svg'
import { ReactComponent as Instagram } from '../SVG/instagram.svg'
import { ReactComponent as Facebook } from '../SVG/facebook.svg'
import { ReactComponent as Whatsapp } from '../SVG/whatsapp.svg'
import { Link } from 'react-router-dom'

const Thankyou = () => {
    return (
        <div className='min-h-screen h-screen flex flex-col justify-between  items-center break-words whitespace-normal text-center'>
            <Header1 />
            <div className='flex flex-col gap-4 items-center font-roboto font-bold'>
                <CheckCircle className='w-36 h-36 mt-6' />
                <h1 className='text-3xl md:text-4xl lg:text-5xl'>Thank you for choosing Tomodachi Tours!</h1>
                <p className='text-2xl'>We've sent you a confirmation email to the address you provided</p>
                <div className='w-5/6 md:w-1/2 text-center'>
                    <p className='font-normal mb-4'>Please contact us at contact@tomodachitours.com if you did not receive your confirmation within 24 hours</p>
                    <p className='font-normal'>Your tour guide will contact you approximately 48 hours before the start of your tour so please ensure Whatsapp is installed and working on your device</p>
                </div>
                <div className='w-2/3 flex flex-col md:flex-row gap-8 md:gap-24'>
                    <div className='basis-1/2 w-full p-8 bg-green-100 rounded-md'>
                        <h3 className='text-center mb-6 text-2xl'>Connect with us</h3>
                        <div className='flex flex-row justify-between'>
                            <a href="https://www.instagram.com/tomodachi_tours/" target='_blank' rel="noopener noreferrer">
                                <Instagram className='w-20 h-20' />
                            </a>
                            <a href="https://wa.me/+8109059609701" target='_blank' rel="noopener noreferrer">
                                <Whatsapp className='w-20 h-20' />
                            </a>
                            <Facebook className='w-20 h-20' />
                        </div>
                    </div>
                    <div className='basis-1/2 flex flex-col items-center gap-8 w-full p-8 bg-blue-100 rounded-md'>
                        <h3 className='text-2xl'>Return to website</h3>
                        <Link to="/" className='bg-blue-500 text-white text-lg rounded-md p-4'>Visit Website</Link>
                    </div>
                </div>
                <span className='font-normal'>Download confirmation here</span>
            </div>
            <Footer />
        </div>
    )
}

export default Thankyou