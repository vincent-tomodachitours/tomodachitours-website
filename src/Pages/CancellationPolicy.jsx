import React from 'react'
import Header from '../Components/Headers/Header1'
import Footer from '../Components/Footer'

const CancellationPolicy = () => {
    return (
        <div className='bg-stone-300 w-full flex flex-col justify-between min-h-screen h-screen'>
            <Header />
            <div className='font-ubuntu mx-auto w-5/6'>
                <h1 className='font-ubuntu text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-12'>Cancellation Policy</h1>
                <p className='mb-2 text-md md:text-lg'>You can cancel up to 24 hours in advance of the experience for a full refund.</p>
                <ul className='list-disc pl-8 text-md md:text-lg'>
                    <li>For a full refund, you must cancel at least 24 hours before the experience’s start time.</li>
                    <li>If you cancel less than 24 hours before the experience’s start time, the amount you paid will not be refunded.</li>
                    <li>Any changes made less than 24 hours before the experience’s start time will not be accepted.</li>
                    <li>Cut-off times are based on the experience’s local time.</li>
                </ul>
            </div>
            <Footer />
        </div>
    )
}

export default CancellationPolicy