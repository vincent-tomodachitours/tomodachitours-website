import React from 'react'
import SEO from '../components/SEO'
import { seoData } from '../data/seoData'

import { ReactComponent as Fail } from '../SVG/fail.svg'

const PaymentFailed = ({ onClick }) => {
    return (
        <div className='w-screen h-screen bg-black bg-opacity-50 fixed inset-0 z-50 flex justify-center items-center'>
            <SEO
                title={seoData.paymentFailed.title}
                description={seoData.paymentFailed.description}
                keywords={seoData.paymentFailed.keywords}
            />
            <div className='w-1/3 h-1/2 flex flex-col items-center gap-4 p-14 font-roboto font-bold bg-white rounded-lg'>
                <Fail className='w-36 h-36 fill-red-500' />
                <h1 className='text-5xl'>Payment failed</h1>
                <button onClick={onClick} className='bg-blue-600 text-white p-4 rounded-md mt-6'>Try Again</button>
            </div>
        </div>
    )
}

export default PaymentFailed